import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

/**
 * Componente para visualizar sites de clientes
 * 
 * Rota: /sites/:subdomain
 * 
 * Funciona em:
 * - Localhost: http://localhost:5173/sites/medhome
 * - Produção: https://adorable-biscochitos-59023a.netlify.app/sites/medhome
 */
export function ClientSiteViewer() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSite = async () => {
      if (!subdomain) {
        setError('Subdomínio não fornecido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('🔍 [ClientSiteViewer] Buscando site para subdomain:', subdomain);

        // Buscar site por subdomain
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/client-sites/by-subdomain/${subdomain}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('📡 [ClientSiteViewer] Status:', response.status);

        const data = await response.json();
        console.log('📦 [ClientSiteViewer] Dados recebidos:', data);
        console.log('📦 [ClientSiteViewer] data.data:', data.data);
        console.log('📦 [ClientSiteViewer] data.data.siteCode existe?', !!data.data?.siteCode);
        console.log('📦 [ClientSiteViewer] data.data.siteCode tamanho:', data.data?.siteCode?.length || 0);

        if (data.success && data.data) {
          const siteData = data.data;
          console.log('✅ [ClientSiteViewer] Site carregado:', siteData.siteName);
          console.log('✅ [ClientSiteViewer] Site tem siteCode?', !!siteData.siteCode);
          console.log('✅ [ClientSiteViewer] Site tem archivePath?', !!siteData.archivePath);
          
          // Se não tem siteCode mas tem archivePath, buscar HTML extraído da rota /serve/*
          if (!siteData.siteCode && siteData.archivePath) {
            console.log('🔍 [ClientSiteViewer] Buscando HTML extraído do ZIP...');
            console.log('🔍 [ClientSiteViewer] archivePath:', siteData.archivePath);
            console.log('🔍 [ClientSiteViewer] subdomain:', siteData.subdomain);
            
            try {
              const serveUrl = `https://${projectId}.supabase.co/functions/v1/rendizy-server/make-server-67caf26a/client-sites/serve/${siteData.subdomain}.rendizy.app`;
              console.log('🔍 [ClientSiteViewer] URL da requisição:', serveUrl);
              
              const serveResponse = await fetch(serveUrl, {
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`,
                }
              });
              
              console.log('📡 [ClientSiteViewer] Resposta do /serve/*:', serveResponse.status, serveResponse.statusText);
              
              if (serveResponse.ok) {
                const htmlContent = await serveResponse.text();
                console.log('✅ [ClientSiteViewer] HTML extraído:', htmlContent.length, 'caracteres');
                console.log('✅ [ClientSiteViewer] Primeiros 200 caracteres:', htmlContent.substring(0, 200));
                
                // Verificar se o HTML parece válido
                if (htmlContent.length > 50 && (htmlContent.includes('<html') || htmlContent.includes('<!DOCTYPE') || htmlContent.includes('<body'))) {
                  console.log('✅ [ClientSiteViewer] HTML parece válido!');
                  siteData.siteCode = htmlContent;
                } else {
                  console.warn('⚠️ [ClientSiteViewer] HTML extraído não parece válido ou está muito pequeno');
                  console.warn('⚠️ [ClientSiteViewer] Conteúdo:', htmlContent);
                }
              } else {
                const errorText = await serveResponse.text();
                console.warn('⚠️ [ClientSiteViewer] Erro ao buscar HTML extraído:', serveResponse.status);
                console.warn('⚠️ [ClientSiteViewer] Resposta:', errorText.substring(0, 200));
              }
            } catch (serveErr: any) {
              console.error('❌ [ClientSiteViewer] Erro ao buscar HTML extraído:', serveErr);
              console.error('❌ [ClientSiteViewer] Mensagem:', serveErr.message);
            }
          }
          
          setSiteConfig(siteData);
        } else {
          setError(data.error || 'Site não encontrado');
          console.error('❌ [ClientSiteViewer] Erro:', data.error);
        }
      } catch (err: any) {
        console.error('❌ [ClientSiteViewer] Erro ao buscar site:', err);
        setError(err.message || 'Erro ao carregar site');
      } finally {
        setLoading(false);
      }
    };

    fetchSite();
  }, [subdomain]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando site...</p>
          <p className="text-sm text-gray-500 mt-2">{subdomain}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar site</h1>
          <p className="text-gray-600 mb-2">{error}</p>
          <p className="text-sm text-gray-500 mt-4">Subdomínio: <code className="bg-gray-100 px-2 py-1 rounded">{subdomain}</code></p>
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Dica:</strong> Verifique se o site foi criado e está ativo na tela de gerenciamento.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Site not found
  if (!siteConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Site não encontrado</h1>
          <p className="text-gray-600 mb-2">
            O site para o subdomínio <strong>"{subdomain}"</strong> não foi encontrado.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Verifique se o site foi criado e está ativo na tela de gerenciamento de sites.
          </p>
        </div>
      </div>
    );
  }

  // Site inactive
  if (!siteConfig.isActive) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">{siteConfig.siteName}</h1>
          <p className="text-gray-600 mb-2">Este site está desativado.</p>
          <p className="text-sm text-gray-500 mt-4">
            Ative o site na tela de gerenciamento para visualizá-lo.
          </p>
        </div>
      </div>
    );
  }

  // Render site code if available
  if (siteConfig.siteCode) {
    // Se o HTML tem estrutura completa (html, head, body), usar iframe
    const hasFullStructure = siteConfig.siteCode.includes('<html') || siteConfig.siteCode.includes('<!DOCTYPE');
    
    if (hasFullStructure) {
      // Criar blob URL para o HTML completo
      const htmlBlob = new Blob([siteConfig.siteCode], { type: 'text/html' });
      const htmlUrl = URL.createObjectURL(htmlBlob);
      
      return (
        <div className="w-full h-full" style={{ height: '100vh', width: '100vw', margin: 0, padding: 0 }}>
          <iframe
            src={htmlUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              margin: 0,
              padding: 0
            }}
            title={siteConfig.siteName}
            onLoad={() => {
              console.log('✅ [ClientSiteViewer] iframe carregado com sucesso');
              // Liberar URL do blob após carregar
              setTimeout(() => URL.revokeObjectURL(htmlUrl), 1000);
            }}
          />
        </div>
      );
    } else {
      // HTML parcial, renderizar diretamente
      return (
        <div className="w-full h-full">
          <div dangerouslySetInnerHTML={{ __html: siteConfig.siteCode }} />
        </div>
      );
    }
  }

  // Default: Site em construção
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{siteConfig.siteName}</h1>
        <p className="text-gray-600 mb-4">Site em construção</p>
        <p className="text-sm text-gray-500 mb-6">
          O código do site ainda não foi importado. Faça o upload do código na tela de gerenciamento.
        </p>
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Próximos passos:</strong>
          </p>
          <ul className="text-sm text-blue-700 mt-2 text-left list-disc list-inside">
            <li>Importar código do site (HTML/React)</li>
            <li>Ou fazer upload de arquivo (ZIP/TAR)</li>
            <li>Configurar integração com backend</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

