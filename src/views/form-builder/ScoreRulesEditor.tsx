// views/form-builder/ScoreRulesEditor.tsx
'use client';

import { ProfessionalSelect } from '@/components/select/ProfessionalSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScoreRule } from '@/types/form-builder';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, PlusCircle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ScoreRulesEditorProps {
    isActive: boolean;
    scoreRules: ScoreRule[];
    onScoreRulesChange: (rules: ScoreRule[]) => void;
}

export const ScoreRulesEditor = ({
    isActive,
    scoreRules,
    onScoreRulesChange
}: ScoreRulesEditorProps) => {
    const [rules, setRules] = useState<ScoreRule[]>(scoreRules || []);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    useEffect(() => {
        setRules(scoreRules || []);
    }, [scoreRules]);

    const handleAddRule = () => {
        const newRule: ScoreRule = {
            minScore: 0,
            maxScore: 0,
            classification: '',
            conduct: '',
            targetUserId: '',
            order: rules.length,
        };
        const updatedRules = [...rules, newRule];
        setRules(updatedRules);
        onScoreRulesChange(updatedRules);
        setExpandedIndex(updatedRules.length - 1);
    };

    const handleDeleteRule = (index: number) => {
        const updatedRules = rules.filter((_, i) => i !== index);
        // Reorder
        updatedRules.forEach((rule, idx) => {
            rule.order = idx;
        });
        setRules(updatedRules);
        onScoreRulesChange(updatedRules);
        if (expandedIndex === index) {
            setExpandedIndex(null);
        }
    };

    const handleRuleChange = (index: number, field: keyof ScoreRule, value: any) => {
        const updatedRules = [...rules];
        updatedRules[index] = {
            ...updatedRules[index],
            [field]: value,
        };
        setRules(updatedRules);
        onScoreRulesChange(updatedRules);
    };

    const handleOnDragEnd = (result: DropResult) => {
        const { source, destination } = result;
        if (!destination) return;

        const items = Array.from(rules);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);

        // Reorder the order field
        items.forEach((rule, idx) => {
            rule.order = idx;
        });

        setRules(items);
        onScoreRulesChange(items);
    };

    if (!isActive) {
        return null;
    }

    return (
        <div className="mt-12">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Regras de Encaminhamento por Pontuação</h2>
                <Button
                    onClick={handleAddRule} className=" bg-primary hover:bg-primary-600 [&_svg]:text-white [&_svg]:size-6 w-10 h-10 ">
                    <PlusCircle className="text-gray-600" />
                </Button>
            </div>

            {
                rules.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>Nenhuma regra de encaminhamento adicionada.</p>
                        <p className="text-sm mt-2">Adicione regras para automatizar o encaminhamento baseado na pontuação do formulário.</p>
                    </div>
                ) : (
                    <DragDropContext onDragEnd={handleOnDragEnd}>
                        <Droppable droppableId="score-rules" type="rule">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                    {rules.map((rule, index) => (
                                        <Draggable key={`rule-${index}`} draggableId={`rule-${index}`} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`border rounded-lg p-4 bg-white transition-all ${snapshot.isDragging ? 'shadow-lg bg-blue-50' : 'shadow-sm'
                                                        } ${expandedIndex === index ? 'ring-2 ring-primary' : ''}`}
                                                >
                                                    {/* Header com drag handle */}
                                                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}>
                                                        <div {...provided.dragHandleProps} className="text-gray-400 hover:text-gray-600">
                                                            <GripVertical size={18} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-gray-700">
                                                                {rule.classification || `Regra ${index + 1}`}
                                                            </h3>
                                                            <p className="text-sm text-gray-500">
                                                                Pontuação: {rule.minScore} - {rule.maxScore}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteRule(index);
                                                            }}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 size={18} />
                                                        </Button>
                                                    </div>

                                                    {/* Conteúdo expansível */}
                                                    {expandedIndex === index && (
                                                        <div className="mt-4 pt-4 border-t space-y-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                        Pontuação Mínima
                                                                    </label>
                                                                    <Input
                                                                        type="number"
                                                                        value={rule.minScore}
                                                                        onChange={(e) => handleRuleChange(index, 'minScore', parseInt(e.target.value) || 0)}
                                                                        className="w-full border-gray-300"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                        Pontuação Máxima
                                                                    </label>
                                                                    <Input
                                                                        type="number"
                                                                        value={rule.maxScore}
                                                                        onChange={(e) => handleRuleChange(index, 'maxScore', parseInt(e.target.value) || 0)}
                                                                        className="w-full border-gray-300"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    Classificação
                                                                </label>
                                                                <Input
                                                                    type="text"
                                                                    placeholder="Ex: Dor aguda ou leve"
                                                                    value={rule.classification}
                                                                    onChange={(e) => handleRuleChange(index, 'classification', e.target.value)}
                                                                    className="w-full border-gray-300"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    Conduta/Recomendação
                                                                </label>
                                                                <textarea
                                                                    placeholder="Ex: Acompanhamento na UBS com reavaliação em 30 dias"
                                                                    value={rule.conduct}
                                                                    onChange={(e) => handleRuleChange(index, 'conduct', e.target.value)}
                                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                                    rows={3}
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    Profissional Responsável pelo Encaminhamento
                                                                </label>
                                                                <ProfessionalSelect
                                                                    value={rule.targetUserId}
                                                                    onChange={(value) => handleRuleChange(index, 'targetUserId', value)}
                                                                    placeholder="Selecione um profissional"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                )
            }
        </div >
    );
};
