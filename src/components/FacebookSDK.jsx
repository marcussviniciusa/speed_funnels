import React, { useEffect } from 'react';

const FacebookSDK = ({ appId, onLoad }) => {
  useEffect(() => {
    // Função para carregar o SDK do Facebook
    const loadFacebookSDK = () => {
      // Verificar se o SDK já está carregado
      if (window.FB) {
        if (typeof onLoad === 'function') {
          onLoad(window.FB);
        }
        return;
      }

      // Adicionar o script do SDK
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v16.0'
        });
        
        // Notificar que o SDK foi carregado
        if (typeof onLoad === 'function') {
          onLoad(window.FB);
        }
      };

      // Carregar o SDK
      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/pt_BR/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    };

    loadFacebookSDK();

    // Cleanup
    return () => {
      // Remover o script se necessário
      const facebookScript = document.getElementById('facebook-jssdk');
      if (facebookScript) {
        // Não remover para evitar problemas com outros componentes que usam o SDK
        // facebookScript.parentNode.removeChild(facebookScript);
      }
    };
  }, [appId, onLoad]);

  // Este componente não renderiza nada visível
  return null;
};

export default FacebookSDK;
