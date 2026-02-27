'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/lib/store/useWorkspaceStore';
import { ListsGrid } from '@/components/lists/ListsGrid';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { HowItWorksModal } from '@/components/ui/HowItWorksModal';
import { useToast } from '@/lib/hooks/useToast';
import { useT } from '@/lib/hooks/useT';

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const { lists, loading, error, pagination, fetchLists, createList, deleteList, clearError } =
    useWorkspaceStore();

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, toast, clearError]);

  const handleCreateList = async (name: string) => {
    try {
      await createList(name);
      toast.success(t('dashboard.listCreated', { name }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('dashboard.errorCreate'));
    }
  };

  const handleDeleteList = async (id: string) => {
    try {
      await deleteList(id);
      toast.success(t('dashboard.listDeleted'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('dashboard.errorDelete'));
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('pollo_passphrase');
    }
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    router.push('/access');
  };

  return (
    <div className="min-h-screen bg-retro-cream-50">
      {/* Header Retro Sólido */}
      <header className="bg-primary-500 border-b-4 border-primary-700 shadow-[0px_8px_0px_rgba(210,125,45,0.4)] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex items-center justify-between gap-3 sm:gap-4">
          <img src="/logo_solo.png" alt="Pollo" className="h-14 sm:h-18 w-auto flex-shrink-0 object-contain" />
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="ghost" onClick={() => setShowHowItWorks(true)} className="border-white text-white hover:bg-white/20" title={t('dashboard.helpTitle')} aria-label={t('dashboard.help')}>
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">{t('dashboard.help')}</span>
            </Button>
            <Button variant="ghost" onClick={() => router.push('/dashboard/settings')} className="border-white text-white hover:bg-white/20">
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">{t('dashboard.settings')}</span>
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="border-white text-white hover:bg-white/20">
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">{t('dashboard.logout')}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Contador de listas */}
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-retro-brown-800 uppercase tracking-wide">{t('dashboard.myLists')}</h2>
          <span className="text-xs text-retro-brown-600 font-bold bg-retro-cream-200 px-3 py-1 rounded-full border-2 border-retro-brown-300">
            {lists.length} {lists.length !== 1 ? t('dashboard.listPlural') : t('dashboard.listSingular')}
          </span>
        </div>

        <ListsGrid
          lists={lists}
          onDelete={handleDeleteList}
          onCreateList={handleCreateList}
          isLoading={loading && lists.length === 0}
          isCreating={loading}
        />

        {/* Paginación */}
        {pagination.total > pagination.limit && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="secondary"
              onClick={() => fetchLists({ offset: Math.max(0, pagination.offset - pagination.limit), limit: pagination.limit })}
              disabled={pagination.offset === 0 || loading}
            >
              {t('dashboard.prevPage')}
            </Button>
            <span className="text-sm text-gray-600">
              {t('dashboard.page', {
                current: Math.floor(pagination.offset / pagination.limit) + 1,
                total: Math.ceil(pagination.total / pagination.limit),
              })}
            </span>
            <Button
              variant="secondary"
              onClick={() => fetchLists({ offset: pagination.offset + pagination.limit, limit: pagination.limit })}
              disabled={pagination.offset + pagination.limit >= pagination.total || loading}
            >
              {t('dashboard.nextPage')}
            </Button>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t-2 border-retro-brown-200 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-retro-brown-500 font-bold uppercase tracking-wide">
            {t('dashboard.coffee')}
          </p>
          <a
            href="https://buymeacoffee.com/patatapython"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-amber-900 font-bold px-5 py-3 rounded-[20px] border-3 border-amber-500 shadow-[4px_4px_0px_rgba(180,120,0,0.3)] hover:shadow-[2px_2px_0px_rgba(180,120,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-wide text-sm"
          >
            {t('dashboard.buyMeCoffee')}
          </a>
          <a href="/legal" className="text-xs text-retro-brown-400 font-bold uppercase tracking-wide hover:text-primary-600 transition-colors mt-2">
            {t('legal.title')}
          </a>
        </footer>
      </main>

      <HowItWorksModal isOpen={showHowItWorks} onClose={() => setShowHowItWorks(false)} />

      <ConfirmModal
        isOpen={showLogoutConfirm}
        title={t('dashboard.logoutTitle')}
        message={t('dashboard.logoutMessage')}
        confirmLabel={t('dashboard.logoutConfirm')}
        cancelLabel={t('dashboard.logoutCancel')}
        variant="danger"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
