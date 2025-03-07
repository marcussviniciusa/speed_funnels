import React, { useEffect } from 'react';

/**
 * Componente para carregar e inicializar o SDK do Facebook
 * Deve ser importado e usado no componente App ou outro componente de alto nível
 */
const FacebookSDK = ({ appId, onSDKLoaded }) => {
  useEffect(() => {
    // Função para inicializar o SDK do Facebook
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: appId,
        cookie: true,
        xfbml: true,
        version: 'v18.0' // Usar a versão mais recente do SDK
      });
      
      // Notificar o componente pai quando o SDK estiver carregado
      if (typeof onSDKLoaded === 'function') {
        onSDKLoaded(window.FB);
      }
    };

    // Carregar o SDK do Facebook de forma assíncrona
    (function(d, s, id) {
      const fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      const js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/pt_BR/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    // Limpar quando o componente for desmontado
    return () => {
      // Remover script do SDK se necessário
      const fbRoot = document.getElementById('fb-root');
      if (fbRoot) {
        fbRoot.remove();
      }
      
      // Remover objeto FB global
      delete window.FB;
      delete window.fbAsyncInit;
    };
  }, [appId, onSDKLoaded]);

  // Este componente não renderiza nada visível
  return <div id="fb-root"></div>;
};

export default FacebookSDK;
