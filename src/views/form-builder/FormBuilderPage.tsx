// views/form-builder/FormBuilderPage.tsx
'use client';

import BtnVoltar from '@/components/buttons/btn-voltar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAlert } from '@/hooks/use-alert';
import { useAuth } from '@/hooks/use-auth';
import api from '@/services/api';
import { FormQuestion, FormState } from '@/types/form-builder';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import clsx from 'clsx';
import { PlusCircle, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { QuestionCard } from './QuestionCard';
import { ScoreRulesEditor } from './ScoreRulesEditor';

interface FormBuilderPageProps {
    formId?: string;
}

const EMPTY_STATE: FormState = {
    title: '',
    description: '',
    questions: [],
    scoreRules: [],
};



export const FormBuilderPage = ({ formId }: FormBuilderPageProps) => {
    const { getPermissions, loading: authLoading } = useAuth();

    const router = useRouter();
    const [formState, setFormState] = useState<FormState>(EMPTY_STATE);
    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const alert = useAlert();

    const permissions = !authLoading && getPermissions
        ? getPermissions('formulario')
        : null;

    // Efeito para carregar dados do formulário quando houver formId
    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!formId) {
            // Tela de criação: estado inicial vazio
            setFormState(EMPTY_STATE);
            setActiveQuestionId(null);
            setIsLoading(false);
            return;
        }

        if (!permissions?.visualizar) {
            setIsLoading(false);
            return;
        }

        let isCancelled = false;

        const fetchForm = async () => {
            try {
                setIsLoading(true);
                const response = await api.get(`/forms/${formId}`);
                if (isCancelled) return;

                const data = response.data;
                setFormState(data);
                if (data.questions.length > 0) {
                    setActiveQuestionId(data.questions[0].id);
                } else {
                    setActiveQuestionId(null);
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error("Falha ao carregar formulário:", error);
                    setFormState(EMPTY_STATE);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchForm();

        return () => {
            isCancelled = true;
        };
    }, [authLoading, formId, permissions?.visualizar]);

    // Se o auth ainda estiver carregando ou o form não foi inicializado, mostramos skeletons mais ricos
    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen px-4 sm:px-8 py-12">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="w-3/4">
                            <Skeleton className="h-10 w-3/4" />
                            <Skeleton className="h-4 w-2/3 mt-2" />
                        </div>
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-28" />
                            <Skeleton className="h-10 w-10 rounded-full" />
                        </div>
                    </div>

                    <div className="bg-background-foreground p-6 rounded-lg shadow-md border-t-8 border-primary">
                        <Skeleton className="h-8 w-full mb-4" />
                        <Skeleton className="h-24 w-full" />
                    </div>

                    <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-background-foreground p-4 rounded-lg shadow-sm">
                                <Skeleton className="h-6 w-1/2 mb-3" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end items-center gap-4">
                        <Skeleton className="h-10 w-28" />
                        <Skeleton className="h-14 w-14 rounded-full" />
                    </div>
                </div>
            </div>
        );
    }

    // Controle básico de acesso: se estamos editando (formId) requer visualizar, se criando requer criar
    if (formId && !permissions?.visualizar) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div>Você não tem permissão para editar este formulário.</div>
            </div>
        );
    }

    if (!formId && !permissions?.criar) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div>Você não tem permissão para criar formulários.</div>
            </div>
        );
    }

    // Nenhum outro efeito adicional necessário; dados são carregados no efeito acima

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (formId) {
                const response = await api.put(`/forms/${formId}`, formState);
                const savedData = response.data;
                setFormState(savedData);
            } else {
                const response = await api.post(`/forms`, formState);
                const newData = response.data;
                router.push(`/admin/criar-formulario/${newData.idForm}`);
            }
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            alert.setAlert(error?.response?.data?.message || 'Erro ao salvar o formulário.', 'error');
        } finally {
            setIsSaving(false);
        }
    };



    const handleOnDragEnd = (result: DropResult) => {
        const { source, destination, type } = result;
        if (!destination) return;
        if (type === 'question') {
            const items = Array.from(formState.questions);
            const [reorderedItem] = items.splice(source.index, 1);
            items.splice(destination.index, 0, reorderedItem);
            setFormState({ ...formState, questions: items });
            return;
        }
        if (type === 'option') {
            const questionId = source.droppableId;
            const question = formState.questions.find(q => q.idQuestion === questionId);
            if (!question) return;
            const reorderedOptions = Array.from(question.options);
            const [movedOption] = reorderedOptions.splice(source.index, 1);
            reorderedOptions.splice(destination.index, 0, movedOption);
            const updatedQuestions = formState.questions.map(q =>
                q.idQuestion === questionId ? { ...q, options: reorderedOptions } : q
            );
            setFormState({ ...formState, questions: updatedQuestions });
        }
    };

    const addQuestion = () => {
        const newQuestion: FormQuestion = {
            idQuestion: uuidv4(),
            text: '',
            type: 'MULTIPLE_CHOICE',
            options: [{ idOption: uuidv4(), text: 'Opção 1', value: null }],
            required: false,
        };
        setFormState({
            ...formState,
            questions: [...formState.questions, newQuestion],
        });
        setActiveQuestionId(newQuestion.idQuestion);
    };

    const updateQuestion = (updatedQuestion: FormQuestion) => {
        const newQuestions = formState.questions.map(q =>
            q.idQuestion === updatedQuestion.idQuestion ? updatedQuestion : q
        );
        setFormState({ ...formState, questions: newQuestions });
    };

    const deleteQuestion = (idToDelete: string) => {
        const newQuestions = formState.questions.filter(q => q.idQuestion !== idToDelete);
        setFormState({ ...formState, questions: newQuestions });
        if (activeQuestionId === idToDelete) {
            setActiveQuestionId(null);
        }
    };

    const duplicateQuestion = (idToDuplicate: string) => {
        const questionToDuplicate = formState.questions.find(q => q.idQuestion === idToDuplicate);
        if (!questionToDuplicate) return;
        const newQuestion: FormQuestion = {
            ...questionToDuplicate,
            idQuestion: uuidv4(),
            options: questionToDuplicate.options.map(opt => ({ ...opt, idOption: uuidv4() }))
        };
        const originalIndex = formState.questions.findIndex(q => q.idQuestion === idToDuplicate);
        const newQuestions = [...formState.questions];
        newQuestions.splice(originalIndex + 1, 0, newQuestion);
        setFormState({ ...formState, questions: newQuestions });
        setActiveQuestionId(newQuestion.idQuestion);
    };



    return (
        <div className="min-h-screen px-2 sm:px-8 relative max-w-4xl mx-auto xxl:pt-2 pt-12" onClick={() => setActiveQuestionId(null)}>
            <BtnVoltar />

            <div className="fixed sm:right-10 right-3 bottom-10 rounded-lg shadow-lg border z-50">
                <Button onClick={(e) => { e.stopPropagation(); addQuestion(); }} className=" bg-primary hover:bg-primary-600 [&_svg]:text-white [&_svg]:size-6 w-14 h-14 ">
                    <PlusCircle className="text-gray-600" />
                </Button>
            </div>
            <div className='w-full flex justify-end pb-2'>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-primary text-white px-6 py-2 rounded-lg shadow-md hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
                >
                    <Save size={18} />
                    {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
            </div>
            <div className="mx-auto pt-16 sm:pt-0 pb-20">
                <div
                    className={clsx("bg-background-foreground p-6 rounded-lg shadow-md border-t-8 border-primary mb-6", {
                        "border-2 border-t-8 border-primary": activeQuestionId === "header",
                    })}
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveQuestionId("header")}
                    }

                >
                    <input
                        type="text"
                        placeholder="Título do formulário"
                        value={formState.title}
                        onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                        className="w-full text-3xl border-b-2 border-gray-200 focus:border-primary outline-none pb-2 bg-transparent"
                    />
                    <textarea
                        value={formState.description}
                        onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                        className="w-full mt-4 text-gray-600 border-b border-gray-200 focus:border-primary outline-none bg-transparent"
                        placeholder="Descrição do formulário"
                    />

                    <ScoreRulesEditor
                        isActive={activeQuestionId === "header"}
                        scoreRules={formState.scoreRules || []}
                        onScoreRulesChange={(rules) => setFormState({ ...formState, scoreRules: rules })}
                    />
                </div>

                <DragDropContext onDragEnd={handleOnDragEnd}>
                    <Droppable droppableId="questions" type="question">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                {formState.questions.map((question, index) => (
                                    <div key={question.idQuestion} onClick={(e) => e.stopPropagation()}>
                                        <QuestionCard
                                            question={question}
                                            index={index}
                                            isActive={activeQuestionId === question.idQuestion}
                                            onClick={() => setActiveQuestionId(question.idQuestion)}
                                            updateQuestion={updateQuestion}
                                            deleteQuestion={() => deleteQuestion(question.idQuestion)}
                                            duplicateQuestion={() => duplicateQuestion(question.idQuestion)}
                                        />
                                    </div>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
        </div>
    );
};