const TRANSLATIONS = {
    'en': {
        'lang_name': 'English',
        'title': 'SafeSphere',
        'subtitle': '"AI-powered universal emergency detection and response system"',
        'desc': 'Automatically detects accidents, fire, and panic situations anywhere and provides instant help.',
        'login': 'Login',
        'signup': 'Sign Up',
        'about': 'About SafeSphere',
        'about_desc': 'SafeSphere is a fully AI-powered system that works anywhere without user interaction and can save lives by detecting emergencies in real-time.',
        'features': 'Universal Features',
        'dashboard': 'Command Center',
        'acc_det': 'Accident Detection',
        'fire_det': 'Fire Tracker',
        'gps': 'GPS Tracking',
        'settings': 'Settings',
        'contacts': 'Contacts Management',
        'communicate': 'Emergency Communication',
        'call_now': 'Call Now',
        'send_msg': 'Send Message',
        'fire_detected': 'FIRE DETECTED',
        'impact_detected': 'IMPACT DETECTED',
        'monitoring': 'Monitoring',
        'off': 'OFF',
        'cancel': 'Cancel'
    },
    'es': {
        'lang_name': 'Español',
        'title': 'SafeSphere',
        'subtitle': '"Sistema universal de respuesta y detección de emergencias impulsado por IA"',
        'desc': 'Detecta automáticamente accidentes, incendios y situaciones de pánico en cualquier lugar y proporciona ayuda instantánea.',
        'login': 'Iniciar sesión',
        'signup': 'Regístrate',
        'about': 'Sobre SafeSphere',
        'about_desc': 'SafeSphere es un sistema totalmente impulsado por IA.',
        'features': 'Características Universales',
        'dashboard': 'Centro de Mando',
        'acc_det': 'Detección de Accidentes',
        'fire_det': 'Rastreador de Incendios',
        'gps': 'Rastreo GPS',
        'settings': 'Configuraciones',
        'contacts': 'Gestión de Contactos',
        'communicate': 'Comunicación de Emergencia',
        'call_now': 'Llamar Ahora',
        'send_msg': 'Enviar Mensaje',
        'fire_detected': 'INCENDIO DETECTADO',
        'impact_detected': 'IMPACTO DETECTADO',
        'monitoring': 'Monitoreo',
        'off': 'APAGADO',
        'cancel': 'Cancelar'
    },
    'fr': {
        'lang_name': 'Français',
        'title': 'SafeSphere',
        'subtitle': '"Système universel de détection et de réponse aux urgences basé sur l\'IA"',
        'desc': 'Détecte automatiquement les accidents, les incendies et les situations de panique n\'importe où.',
        'login': 'Connexion',
        'signup': 'S\'inscrire',
        'about': 'À propos de SafeSphere',
        'about_desc': 'SafeSphere est un système entièrement basé sur l\'IA.',
        'features': 'Caractéristiques Universelles',
        'dashboard': 'Centre de Commandement',
        'acc_det': 'Détection d\'Accident',
        'fire_det': 'Suivi des Incendies',
        'gps': 'Suivi GPS',
        'settings': 'Paramètres',
        'contacts': 'Gestion des Contacts',
        'communicate': 'Communication d\'Urgence',
        'call_now': 'Appeler Maintenant',
        'send_msg': 'Envoyer un Message',
        'fire_detected': 'INCENDIE DÉTECTÉ',
        'impact_detected': 'IMPACT DÉTECTÉ',
        'monitoring': 'Surveillance',
        'off': 'DÉSACTIVÉ',
        'cancel': 'Annuler'
    }
};

function applyLanguage(lang) {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    document.querySelectorAll('[data-lang]').forEach(el => {
        const key = el.getAttribute('data-lang');
        if (dict[key]) el.innerHTML = dict[key];
    });
}
