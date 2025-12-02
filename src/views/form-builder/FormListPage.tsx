'use client';

import ConfirmDialog from '@/components/ui/confirm-dialog';
import { useAuth } from '@/hooks/use-auth';
import api from '@/services/api';
import {
    AlertTriangle,
    CalendarDays,
    Edit,
    List,
    ListChecks,
    MoreVertical,
    Plus,
    Trash2,
    UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

// shadcn/ui components
import BtnVoltar from '@/components/buttons/btn-voltar';
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

// Tipo para os dados que esperamos do back-end (GET /forms)
type FormListItem = {
    idForm: string;
    title: string;
    description: string | null;
    updatedAt: string;
    responses: number;
};

export default function FormListPage() {
    const [forms, setForms] = useState<FormListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { getPermissions, loading: authLoading } = useAuth();
    const permissions = useMemo(() => getPermissions('formulario'), [getPermissions]);

    const basePath = '/admin/criar-formulario';

    const fetchForms = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/forms');
            setForms(response.data);
            setError(null);
        } catch (err) {
            console.error("Erro ao buscar formulários:", err);
            setError("Não foi possível carregar os formulários.");
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        if (permissions?.visualizar) fetchForms();
    }, [permissions?.visualizar]); // Roda quando permissões estiverem disponíveis

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    const performDelete = async (id: string) => {
        try {
            await api.delete(`/forms/${id}`);
            fetchForms();
        } catch (err) {
            console.error("Erro ao excluir:", err);
        }
    };

    const handleConfirmDelete = () => {
        if (!pendingDeleteId) return;
        performDelete(pendingDeleteId);
        setPendingDeleteId(null);
        setConfirmOpen(false);
    };

    // Componente de Skeleton para o loading
    const renderSkeletons = () => (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
            ))}
        </div>
    );

    // Renderização principal
    const renderContent = () => {
        if (isLoading) {
            return renderSkeletons();
        }

        if (error) {
            return (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            );
        }

        if (forms.length === 0) {
            return (
                <Card>
                    <CardContent className="p-10 text-center">
                        <p className="text-muted-foreground">
                            Nenhum formulário criado ainda.
                        </p>
                    </CardContent>
                </Card>
            );
        }

        return (
            <div className="space-y-4">
                {forms.map(form => (
                    <Card key={form.idForm}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <div className="space-y-1.5">
                                {/* 1. Corrigido para text-primary semântico */}
                                <CardTitle className='text-primary text-wrap'>{form.title}</CardTitle>
                                <CardDescription className="truncate text-wrap">
                                    {form.description || 'Sem descrição'}
                                </CardDescription>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    {/* 2. Removido hover:text-white que conflitava com 'ghost' */}
                                    <Button variant="ghost" size="icon" className='rounded-full min-w-10'>
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href={`${basePath}/${form.idForm}`} className="cursor-pointer">
                                            <Edit className="mr-2 h-4 w-4" />
                                            <span>Editar Formulário</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={`${basePath}/${form.idForm}/respostas`} className="cursor-pointer">
                                            <ListChecks className="mr-2 h-4 w-4" />
                                            <span>Ver Respostas</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/admin/responder-formulario/${form.idForm}`} className="cursor-pointer">
                                            <List className="mr-2 h-4 w-4" />
                                            <span>Responder Formulário</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={`/admin/atribuir-usuarios/${form.idForm}`}
                                            className="cursor-pointer"
                                        >
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            <span>Atribuir Usuários</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />

                                    {/* 3. Corrigido para "destructive" semântico */}
                                    <DropdownMenuItem
                                        className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
                                        onSelect={() => setTimeout(() => { setPendingDeleteId(form.idForm); setConfirmOpen(true); }, 50)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Excluir</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>

                        {/* 4. Footer melhorado com ícones, flex e melhor texto */}
                        <CardFooter className='flex justify-between text-sm text-muted-foreground'>
                            <div className="flex items-center">
                                <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                                <span>
                                    {new Date(form.updatedAt).toLocaleDateString('pt-BR', {
                                        day: '2-digit', month: '2-digit', year: 'numeric'
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <ListChecks className="mr-1.5 h-3.5 w-3.5" />
                                <span>
                                    {form.responses} {form.responses === 1 ? 'Resposta' : 'Respostas'}
                                </span>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        );
    };

    return (
        <div className="p-8 max-w-4xl mx-auto relative xxl:pt-9 pt-12">
            <BtnVoltar className=''/>
            <div className="flex flex-col justify-between items-center mb-6 md:flex-row sm:gap-4">
                <h1 className="text-3xl font-bold">Meus Formulários</h1>

                <Link href={basePath}>
                    <Button className='text-white'>
                        <Plus size={18} className="mr-2" />
                        Criar Novo Formulário
                    </Button>
                </Link>
            </div>

            {renderContent()}

            <ConfirmDialog
                open={confirmOpen}
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
                title="Excluir formulário"
                description="Tem certeza que deseja excluir este formulário? Esta ação não pode ser desfeita."
                confirmLabel="Excluir"
            />
        </div>
    );
}