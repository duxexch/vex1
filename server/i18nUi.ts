// SEO/GEO UI translations for all 8 languages (ar, en, es, ru, fr, de, tr, pt)
// Used by SSR pages: homepage block, company pages, guides, predictions

export const LANGS = ['ar', 'en', 'es', 'ru', 'fr', 'de', 'tr', 'pt'] as const;
export type Lang = (typeof LANGS)[number];

export const isLang = (l: unknown): l is Lang => typeof l === 'string' && (LANGS as readonly string[]).includes(l);

type Row = Record<Lang, string>;

const T: Record<string, Row> = {
  // ---------- Homepage SEO block ----------
  'home.what_you_get': {
    ar: 'ماذا تحصل عليه؟', en: 'What do you get?', es: '¿Qué obtienes?', ru: 'Что вы получаете?',
    fr: 'Que obtenez-vous ?', de: 'Was bekommen Sie?', tr: 'Ne kazanırsınız?', pt: 'O que você recebe?',
  },
  'home.b1': {
    ar: '<strong>تتبع المحافظ:</strong> راقب أرصدة أكثر من 12 شركة مراهنات معتمدة في مكان واحد',
    en: '<strong>Wallet Tracking:</strong> Monitor balances across 12+ licensed betting companies in one place',
    es: '<strong>Seguimiento de carteras:</strong> Supervisa saldos de más de 12 casas de apuestas licenciadas en un solo lugar',
    ru: '<strong>Отслеживание кошельков:</strong> Следите за балансами 12+ лицензированных букмекеров в одном месте',
    fr: '<strong>Suivi des portefeuilles :</strong> Suivez les soldes de plus de 12 bookmakers agréés en un seul endroit',
    de: '<strong>Guthaben-Tracking:</strong> Behalten Sie die Salden von 12+ lizenzierten Wettanbietern an einem Ort im Blick',
    tr: '<strong>Cüzdan Takibi:</strong> 12+ lisanslı bahis şirketinin bakiyesini tek yerden takip edin',
    pt: '<strong>Acompanhamento de carteiras:</strong> Monitore saldos de mais de 12 casas de apostas licenciadas em um só lugar',
  },
  'home.b2': {
    ar: '<strong>تعويض الخسائر:</strong> احصل على نسب مئوية حقيقية على خسائرك وحوّلها فوراً',
    en: '<strong>Loss Compensation:</strong> Get real percentage refunds on your losses and transfer instantly',
    es: '<strong>Compensación de pérdidas:</strong> Obtén reembolsos porcentuales reales y transfiere al instante',
    ru: '<strong>Компенсация убытков:</strong> Получайте реальный процентный возврат потерь с мгновенным переводом',
    fr: '<strong>Indemnisation des pertes :</strong> Obtenez un remboursement pourcentage réel et transférez instantanément',
    de: '<strong>Verlustersatz:</strong> Erhalten Sie echte prozentuale Rückerstattungen und überweisen Sie sofort',
    tr: '<strong>Kayıp Tazminatı:</strong> Kayıplarınıza gerçek yüzdelik iade alın ve anında transfer edin',
    pt: '<strong>Compensação de perdas:</strong> Receba reembolsos percentuais reais e transfira na hora',
  },
  'home.b3': {
    ar: '<strong>توقعات AI:</strong> تحليلات مباريات دقيقة بمحرك Gemini مع احتمالات فوز ونتائج متوقعة',
    en: '<strong>AI Predictions:</strong> Accurate match analysis by the Gemini engine with win probabilities and predicted scores',
    es: '<strong>Predicciones IA:</strong> Análisis de partidos preciso con el motor Gemini, probabilidades y resultados previstos',
    ru: '<strong>AI-прогнозы:</strong> Точный анализ матчей от движка Gemini с вероятностями побед и прогнозами счета',
    fr: '<strong>Prédictions IA :</strong> Analyse précise des matchs par le moteur Gemini avec probabilités et scores prévus',
    de: '<strong>KI-Prognosen:</strong> Genaue Spielanalysen der Gemini-Engine mit Siegwahrscheinlichkeiten und TorgPrognosen',
    tr: '<strong>Yapay Zeka Tahminleri:</strong> Gemini motoruyla doğru maç analizleri, kazanma olasılıkları ve skor tahminleri',
    pt: '<strong>Previsões de IA:</strong> Análises precisas de jogos com o motor Gemini, probabilidades e placares previstos',
  },
  'home.b4': {
    ar: '<strong>يانصيب عادل:</strong> سحوبات مُثبتة بتشفير SHA-256 مع جوائز تصل إلى 10,000$',
    en: '<strong>Fair Lottery:</strong> SHA-256 provably fair draws with prizes up to $10,000',
    es: '<strong>Lotería justa:</strong> Sorteos demostrablemente justos con SHA-256 y premios de hasta 10.000 $',
    ru: '<strong>Честная лотерея:</strong> Прозрачные розыгрыши SHA-256 с призами до 10 000 $',
    fr: '<strong>Loterie équitable :</strong> Tirages vérifiables SHA-256 avec des prix jusqu’à 10 000 $',
    de: '<strong>Faires Lotto:</strong> SHA-256 nachweisbar faire Ziehungen mit Preisen bis 10.000 $',
    tr: '<strong>Adil Piyango:</strong> SHA-256 ile kanıtlanabilir adaletli çekilişler, 10.000$’a kadar ödüller',
    pt: '<strong>Loteria justa:</strong> Sorteios comprovadamente justos com SHA-256 e prêmios de até US$ 10.000',
  },
  'home.b5': {
    ar: '<strong>تطبيق جوال:</strong> APK + PWA + iOS مع إشعارات لحظية',
    en: '<strong>Mobile App:</strong> APK + PWA + iOS with real-time notifications',
    es: '<strong>App móvil:</strong> APK + PWA + iOS con notificaciones en tiempo real',
    ru: '<strong>Мобильное приложение:</strong> APK + PWA + iOS с уведомлениями в реальном времени',
    fr: '<strong>Application mobile :</strong> APK + PWA + iOS avec notifications en temps réel',
    de: '<strong>Mobile App:</strong> APK + PWA + iOS mit Echtzeit-Benachrichtigungen',
    tr: '<strong>Mobil Uygulama:</strong> Gerçek zamanlı bildirimli APK + PWA + iOS',
    pt: '<strong>Aplicativo móvel:</strong> APK + PWA + iOS com notificações em tempo real',
  },
  'home.keywords_label': {
    ar: 'كلمات مفتاحية', en: 'Keywords', es: 'Palabras clave', ru: 'Ключевые слова',
    fr: 'Mots-clés', de: 'Schlüsselwörter', tr: 'Anahtar kelimeler', pt: 'Palavras-chave',
  },
  'link.guide_comp': {
    ar: 'دليل التعويض', en: 'Compensation Guide', es: 'Guía de compensación', ru: 'Руководство по компенсации',
    fr: 'Guide d’indemnisation', de: 'Erstattungsleitfaden', tr: 'Tazminat Rehberi', pt: 'Guia de compensação',
  },
  'link.guide_ai': {
    ar: 'دليل توقعات AI', en: 'AI Predictions Guide', es: 'Guía de predicciones IA', ru: 'Руководство по AI-прогнозам',
    fr: 'Guide des prédictions IA', de: 'KI-Prognoseleitfaden', tr: 'YZ Tahmin Rehberi', pt: 'Guia de previsões de IA',
  },
  'link.guide_lottery': {
    ar: 'اليانصيب العادل', en: 'Fair Lottery', es: 'Lotería justa', ru: 'Честная лотерея',
    fr: 'Loterie équitable', de: 'Faires Lotto', tr: 'Adil Piyango', pt: 'Loteria justa',
  },
  'link.guide_1xbet': {
    ar: 'دليل بونص 1xBet', en: '1xBet Bonus Guide', es: 'Guía de bonos 1xBet', ru: 'Гайд по бонусам 1xBet',
    fr: 'Guide des bonus 1xBet', de: '1xBet Bonus-Leitfaden', tr: '1xBet Bonus Rehberi', pt: 'Guia de bônus 1xBet',
  },
  'link.guide_wallet': {
    ar: 'تتبّع المحافظ', en: 'Wallet Tracking', es: 'Seguimiento de carteras', ru: 'Отслеживание кошельков',
    fr: 'Suivi des portefeuilles', de: 'Wallet-Tracking', tr: 'Cüzdan Takibi', pt: 'Acompanhamento de carteiras',
  },
  'link.guide_odds': {
    ar: 'دليل الأرقام', en: 'Odds Explained', es: 'Cuotas explicadas', ru: 'Как читать коэффициенты',
    fr: 'Cotes expliquées', de: 'Quoten erklärt', tr: 'Oranlar Açıklamalı', pt: 'Odds explicadas',
  },
  'link.guide_bankroll': {
    ar: 'إدارة الرصيد', en: 'Bankroll Management', es: 'Gestión de bankroll', ru: 'Управление банкроллом',
    fr: 'Gestion de bankroll', de: 'Bankroll-Management', tr: 'Bankroll Yönetimi', pt: 'Gestão de bankroll',
  },

  // ---------- Company pages ----------
  'company.subtitle': {
    ar: 'دليل التعويضات والبونص الكامل', en: 'Complete Compensation & Bonus Guide',
    es: 'Guía completa de compensación y bonos', ru: 'Полное руководство по компенсации и бонусам',
    fr: 'Guide complet des indemnisations et bonus', de: 'Vollständiger Erstattungs- und Bonusleitfaden',
    tr: 'Kapsamlı Tazminat ve Bonus Rehberi', pt: 'Guia completo de compensação e bônus',
  },
  'company.meta_desc': {
    ar: 'كل ما تحتاج معرفته عن {name} عبر {brand}: أكواد الخصم، طلبات التعويض، تحميل التطبيق، وأفضل استراتيجيات الربح.',
    en: 'Everything you need to know about {name} on {brand}: promo codes, compensation claims, app download, and the best winning strategies.',
    es: 'Todo lo que necesitas saber sobre {name} en {brand}: códigos promocionales, solicitudes de compensación, descarga de la app y las mejores estrategias.',
    ru: 'Всё, что нужно знать о {name} на {brand}: промокоды, запросы на компенсацию, скачивание приложения и лучшие стратегии.',
    fr: 'Tout ce qu’il faut savoir sur {name} sur {brand} : codes promo, demandes d’indemnisation, téléchargement de l’app et meilleures stratégies.',
    de: 'Alles über {name} auf {brand}: Aktionscodes, Erstattungsanträge, App-Download und die besten Strategien.',
    tr: '{brand} üzerinde {name} hakkında bilmeniz gereken her şey: promosyon kodları, tazminat talepleri, uygulama indirme ve en iyi stratejiler.',
    pt: 'Tudo sobre {name} na {brand}: códigos promocionais, solicitações de compensação, download do app e as melhores estratégias.',
  },
  'company.og_desc': {
    ar: 'دليل {name} الكامل على {brand}: تعويضات، بونص، تحميل',
    en: 'The complete {name} guide on {brand}: compensation, bonuses, download',
    es: 'La guía completa de {name} en {brand}: compensación, bonos, descarga',
    ru: 'Полное руководство по {name} на {brand}: компенсация, бонусы, скачивание',
    fr: 'Le guide complet de {name} sur {brand} : indemnisation, bonus, téléchargement',
    de: 'Der vollständige {name}-Leitfaden auf {brand}: Erstattung, Boni, Download',
    tr: '{brand} üzerinde kapsamlı {name} rehberi: tazminat, bonus, indirme',
    pt: 'O guia completo de {name} na {brand}: compensação, bônus, download',
  },
  'company.badge_verified': { ar: 'تعويضات موثقة', en: 'Verified Compensation', es: 'Compensación verificada', ru: 'Проверенная компенсация', fr: 'Indemnisation vérifiée', de: 'Verifizierte Erstattung', tr: 'Doğrulanmış Tazminat', pt: 'Compensação verificada' },
  'company.badge_promo': { ar: 'برومو:', en: 'Promo:', es: 'Promo:', ru: 'Промо:', fr: 'Promo :', de: 'Promo:', tr: 'Promo:', pt: 'Promo:' },
  'company.badge_apk': { ar: 'APK متاح', en: 'APK Available', es: 'APK disponible', ru: 'APK доступен', fr: 'APK disponible', de: 'APK verfügbar', tr: 'APK Mevcut', pt: 'APK disponível' },
  'company.badge_instant': { ar: 'تحويل فوري', en: 'Instant Transfer', es: 'Transferencia instantánea', ru: 'Мгновенный перевод', fr: 'Transfert instantané', de: 'Sofortüberweisung', tr: 'Anında Transfer', pt: 'Transferência instantânea' },
  'company.promo_title': { ar: 'كود الخصم الرسمي', en: 'Official Promo Code', es: 'Código promocional oficial', ru: 'Официальный промокод', fr: 'Code promo officiel', de: 'Offizieller Aktionscode', tr: 'Resmi Promosyon Kodu', pt: 'Código promocional oficial' },
  'company.promo_note': {
    ar: 'استخدم هذا الكود عند التسجيل للحصول على أفضل بونص ترحيبي',
    en: 'Use this code during registration to get the best welcome bonus',
    es: 'Usa este código al registrarte para obtener el mejor bono de bienvenida',
    ru: 'Используйте этот код при регистрации, чтобы получить лучший приветственный бонус',
    fr: 'Utilisez ce code lors de l’inscription pour obtenir le meilleur bonus de bienvenue',
    de: 'Verwenden Sie diesen Code bei der Registrierung für den besten Willkommensbonus',
    tr: 'Kayıt olurken bu kodu kullanın ve en iyi hoş geldin bonusunu alın',
    pt: 'Use este código no cadastro para receber o melhor bônus de boas-vindas',
  },
  'company.steps_title': {
    ar: 'كيف تحصل على تعويض {name}؟', en: 'How to claim {name} compensation?', es: '¿Cómo reclamar la compensación de {name}?',
    ru: 'Как получить компенсацию от {name}?', fr: 'Comment obtenir l’indemnisation de {name} ?', de: 'Wie erhalte ich die {name}-Erstattung?',
    tr: '{name} tazminatını nasıl alırsınız?', pt: 'Como solicitar a compensação da {name}?',
  },
  'company.step1': { ar: 'سجّل حسابك عبر {brand} بالكود <code>{promo}</code>', en: 'Register your account on {brand} with code <code>{promo}</code>', es: 'Registra tu cuenta en {brand} con el código <code>{promo}</code>', ru: 'Зарегистрируйте аккаунт на {brand} с кодом <code>{promo}</code>', fr: 'Inscrivez votre compte sur {brand} avec le code <code>{promo}</code>', de: 'Registrieren Sie Ihr Konto bei {brand} mit dem Code <code>{promo}</code>', tr: '{brand}’de <code>{promo}</code> koduyla hesabınızı açın', pt: 'Cadastre sua conta na {brand} com o código <code>{promo}</code>' },
  'company.step2': { ar: 'وثّق رصيدك بلقطة شاشة من محفظتك في {name}', en: 'Verify your balance with a screenshot of your {name} wallet', es: 'Verifica tu saldo con una captura de tu cartera de {name}', ru: 'Подтвердите баланс скриншотом кошелька {name}', fr: 'Vérifiez votre solde avec une capture de votre portefeuille {name}', de: 'Bestätigen Sie Ihr Guthaben mit einem Screenshot Ihres {name}-Wallets', tr: '{name} cüzdanınızın ekran görüntüsüyle bakiyenizi doğrulayın', pt: 'Confirme seu saldo com uma captura da sua carteira da {name}' },
  'company.step3': { ar: 'قدّم طلب التعويض من صفحة المحافظ في {brand}', en: 'Submit the compensation request from the wallets page in {brand}', es: 'Envía la solicitud de compensación desde la página de carteras en {brand}', ru: 'Отправьте запрос на компенсацию со страницы кошельков на {brand}', fr: 'Envoyez la demande d’indemnisation depuis la page des portefeuilles sur {brand}', de: 'Senden Sie den Erstattungsantrag über die Wallet-Seite auf {brand}', tr: '{brand}’deki cüzdanlar sayfasından tazminat talebi gönderin', pt: 'Envie a solicitação de compensação pela página de carteiras na {brand}' },
  'company.step4': { ar: 'استلم نسبتك وتُضاف مباشرة لرصيدك المجمد', en: 'Receive your percentage — it is added directly to your frozen balance', es: 'Recibe tu porcentaje: se añade directamente a tu saldo congelado', ru: 'Получите свой процент — он добавится напрямую к замороженному балансу', fr: 'Recevez votre pourcentage — il est ajouté directement à votre solde gelé', de: 'Erhalten Sie Ihren Prozentsatz — er wird direkt Ihrem eingefrorenen Guthaben gutgeschrieben', tr: 'Yüzde payınızı alın — doğrudan dondurulmuş bakiyenize eklenir', pt: 'Receba seu percentual — ele é adicionado diretamente ao seu saldo congelado' },
  'company.step5': { ar: 'حوّل أو اسحب التعويض لحسابك البنكي أو محفظتك', en: 'Transfer or withdraw the compensation to your bank account or wallet', es: 'Transfiere o retira la compensación a tu cuenta bancaria o cartera', ru: 'Переведите или выведите компенсацию на банковский счёт или кошелёк', fr: 'Transférez ou retirez l’indemnisation vers votre compte bancaire ou portefeuille', de: 'Überweisen oder heben Sie die Erstattung auf Ihr Bankkonto oder Wallet ab', tr: 'Tazminatı banka hesabınıza veya cüzdanınıza aktarın/çekin', pt: 'Transfira ou saque a compensação para sua conta bancária ou carteira' },
  'company.why_title': { ar: 'لماذا {name} عبر {brand}؟', en: 'Why {name} through {brand}?', es: '¿Por qué {name} con {brand}?', ru: 'Почему {name} через {brand}?', fr: 'Pourquoi {name} via {brand} ?', de: 'Warum {name} über {brand}?', tr: 'Neden {brand} üzerinden {name}?', pt: 'Por que a {name} pela {brand}?' },
  'company.why1': { ar: '<strong>تعويض حقيقي</strong> — نسب مئوية فعلية على خسائرك', en: '<strong>Real compensation</strong> — actual percentages on your losses', es: '<strong>Compensación real</strong> — porcentajes reales sobre tus pérdidas', ru: '<strong>Реальная компенсация</strong> — настоящие проценты с ваших потерь', fr: '<strong>Indemnisation réelle</strong> — pourcentages réels sur vos pertes', de: '<strong>Echte Erstattung</strong> — tatsächliche Prozente auf Ihre Verluste', tr: '<strong>Gerçek tazminat</strong> — kayıplarınızda gerçek yüzdelik oranlar', pt: '<strong>Compensação real</strong> — percentuais reais sobre suas perdas' },
  'company.why2': { ar: '<strong>آمن 100%</strong> — تشفير بنكي وحماية ضد الاختراق', en: '<strong>100% secure</strong> — banking-grade encryption and breach protection', es: '<strong>100% seguro</strong> — cifrado bancario y protección contra intrusiones', ru: '<strong>100% безопасно</strong> — банковское шифрование и защита от взломов', fr: '<strong>100 % sécurisé</strong> — chiffrement bancaire et protection contre les intrusions', de: '<strong>100 % sicher</strong> — Bankenverschlüsselung und Schutz vor Angriffen', tr: '<strong>%100 güvenli</strong> — bankacılık düzeyinde şifreleme ve koruma', pt: '<strong>100% seguro</strong> — criptografia bancária e proteção contra invasões' },
  'company.why3': { ar: '<strong>تحويل فوري</strong> — استلم خلال دقائق', en: '<strong>Instant transfer</strong> — receive within minutes', es: '<strong>Transferencia instantánea</strong> — recibe en minutos', ru: '<strong>Мгновенный перевод</strong> — получите в течение минут', fr: '<strong>Transfert instantané</strong> — recevez en quelques minutes', de: '<strong>Sofortüberweisung</strong> — Empfang in Minuten', tr: '<strong>Anında transfer</strong> — dakikalar içinde alın', pt: '<strong>Transferência instantânea</strong> — receba em minutos' },
  'company.why4': { ar: '<strong>دعم عربي</strong> — فريق يتحدث لغتك', en: '<strong>Native-language support</strong> — a team that speaks your language', es: '<strong>Soporte en tu idioma</strong> — un equipo que habla tu lengua', ru: '<strong>Поддержка на вашем языке</strong> — команда, говорящая на вашем языке', fr: '<strong>Support dans votre langue</strong> — une équipe qui parle votre langue', de: '<strong>Support in Ihrer Sprache</strong> — ein Team, das Ihre Sprache spricht', tr: '<strong>Yerel dilde destek</strong> — sizin dilinizi konuşan bir ekip', pt: '<strong>Suporte no seu idioma</strong> — uma equipe que fala a sua língua' },
  'company.why5': { ar: '<strong>تطبيق جوال</strong> — APK + PWA + iOS', en: '<strong>Mobile app</strong> — APK + PWA + iOS', es: '<strong>App móvil</strong> — APK + PWA + iOS', ru: '<strong>Мобильное приложение</strong> — APK + PWA + iOS', fr: '<strong>Application mobile</strong> — APK + PWA + iOS', de: '<strong>Mobile App</strong> — APK + PWA + iOS', tr: '<strong>Mobil uygulama</strong> — APK + PWA + iOS', pt: '<strong>Aplicativo móvel</strong> — APK + PWA + iOS' },
  'company.why6': { ar: '<strong>AI توقعات</strong> — تحليل مباريات بالذكاء الاصطناعي', en: '<strong>AI predictions</strong> — AI-powered match analysis', es: '<strong>Predicciones IA</strong> — análisis de partidos con IA', ru: '<strong>AI-прогнозы</strong> — анализ матчей на основе ИИ', fr: '<strong>Prédictions IA</strong> — analyse des matchs par IA', de: '<strong>KI-Prognosen</strong> — KI-gestützte Spielanalysen', tr: '<strong>YZ tahminleri</strong> — yapay zekâ destekli maç analizi', pt: '<strong>Previsões de IA</strong> — análises de jogos com IA' },
  'company.faq_title': { ar: 'الأسئلة الشائعة عن {name}', en: 'Frequently asked questions about {name}', es: 'Preguntas frecuentes sobre {name}', ru: 'Частые вопросы о {name}', fr: 'Questions fréquentes sur {name}', de: 'Häufige Fragen zu {name}', tr: '{name} hakkında sık sorulan sorular', pt: 'Perguntas frequentes sobre {name}' },
  'company.faq1q': { ar: 'كيف أحصل على تعويض {name}؟', en: 'How do I get {name} compensation?', es: '¿Cómo obtengo la compensación de {name}?', ru: 'Как получить компенсацию от {name}?', fr: 'Comment obtenir l’indemnisation de {name} ?', de: 'Wie erhalte ich die {name}-Erstattung?', tr: '{name} tazminatını nasıl alırım?', pt: 'Como obtenho a compensação da {name}?' },
  'company.faq1a': { ar: 'سجّل عبر {brand}، وثّق رصيدك، قدّم طلب التعويض، واستلم نسبتك مباشرة.', en: 'Register through {brand}, verify your balance, submit the claim, and receive your percentage directly.', es: 'Regístrate en {brand}, verifica tu saldo, envía la solicitud y recibe tu porcentaje directamente.', ru: 'Зарегистрируйтесь на {brand}, подтвердите баланс, отправьте запрос и получите процент напрямую.', fr: 'Inscrivez-vous sur {brand}, vérifiez votre solde, envoyez la demande et recevez votre pourcentage directement.', de: 'Registrieren Sie sich bei {brand}, bestätigen Sie Ihr Guthaben, senden Sie den Antrag und erhalten Sie Ihren Prozentsatz direkt.', tr: '{brand}’e kayıt olun, bakiyenizi doğrulayın, talebi gönderin ve yüzde payınızı doğrudan alın.', pt: 'Cadastre-se na {brand}, confirme seu saldo, envie a solicitação e receba seu percentual diretamente.' },
  'company.faq2q': { ar: 'ما هو كود الخصم؟', en: 'What is the promo code?', es: '¿Cuál es el código promocional?', ru: 'Какой промокод?', fr: 'Quel est le code promo ?', de: 'Wie lautet der Aktionscode?', tr: 'Promosyon kodu nedir?', pt: 'Qual é o código promocional?' },
  'company.faq2a': { ar: 'كود الخصم هو <code>{promo}</code> — استخدمه عند التسجيل.', en: 'The promo code is <code>{promo}</code> — use it when registering.', es: 'El código promocional es <code>{promo}</code> — úsalo al registrarte.', ru: 'Промокод: <code>{promo}</code> — используйте при регистрации.', fr: 'Le code promo est <code>{promo}</code> — utilisez-le à l’inscription.', de: 'Der Aktionscode lautet <code>{promo}</code> — verwenden Sie ihn bei der Registrierung.', tr: 'Promosyon kodu: <code>{promo}</code> — kayıt olurken kullanın.', pt: 'O código promocional é <code>{promo}</code> — use-o no cadastro.' },
  'company.faq3q': { ar: 'هل {name} آمن؟', en: 'Is {name} safe?', es: '¿Es seguro {name}?', ru: 'Безопасен ли {name}?', fr: '{name} est-il sûr ?', de: 'Ist {name} sicher?', tr: '{name} güvenli mi?', pt: 'A {name} é segura?' },
  'company.faq3a': { ar: 'نعم، {brand} يتحقق من أمان كل شركة قبل إضافتها للمنصة.', en: 'Yes, {brand} verifies the safety of every company before adding it to the platform.', es: 'Sí, {brand} verifica la seguridad de cada compañía antes de añadirla a la plataforma.', ru: 'Да, {brand} проверяет безопасность каждой компании перед добавлением на платформу.', fr: 'Oui, {brand} vérifie la sécurité de chaque société avant de l’ajouter à la plateforme.', de: 'Ja, {brand} prüft die Sicherheit jedes Anbieters, bevor er zur Plattform hinzugefügt wird.', tr: 'Evet, {brand} her şirketi platforma eklemeden önce güvenlik açısından doğrular.', pt: 'Sim, a {brand} verifica a segurança de cada empresa antes de adicioná-la à plataforma.' },
  'company.faq4q': { ar: 'كم يستغرق وصول التعويض؟', en: 'How long does compensation take?', es: '¿Cuánto tarda la compensación?', ru: 'Сколько занимает компенсация?', fr: 'Combien de temps prend l’indemnisation ?', de: 'Wie lange dauert die Erstattung?', tr: 'Tazminat ne kadar sürer?', pt: 'Quanto tempo leva a compensação?' },
  'company.faq4a': { ar: 'عادة خلال 24 ساعة كحد أقصى، وأحياناً فوراً.', en: 'Usually within 24 hours at most, sometimes instantly.', es: 'Normalmente en un máximo de 24 horas, a veces al instante.', ru: 'Обычно максимум в течение 24 часов, иногда мгновенно.', fr: 'Généralement en 24 heures au maximum, parfois instantanément.', de: 'Normalerweise höchstens innerhalb von 24 Stunden, manchmal sofort.', tr: 'Genellikle en geç 24 saat içinde, bazen anında.', pt: 'Normalmente em até 24 horas, às vezes na hora.' },
  'company.related_title': { ar: 'صفحات ذات صلة', en: 'Related pages', es: 'Páginas relacionadas', ru: 'Похожие страницы', fr: 'Pages associées', de: 'Ähnliche Seiten', tr: 'İlgili sayfalar', pt: 'Páginas relacionadas' },

  // ---------- CTAs ----------
  'cta.companies': { ar: 'كل الشركات', en: 'All Companies', es: 'Todas las compañías', ru: 'Все компании', fr: 'Toutes les sociétés', de: 'Alle Unternehmen', tr: 'Tüm Şirketler', pt: 'Todas as empresas' },
  'cta.download': { ar: 'تحميل التطبيق', en: 'Download App', es: 'Descargar app', ru: 'Скачать приложение', fr: 'Télécharger l’app', de: 'App herunterladen', tr: 'Uygulamayı İndir', pt: 'Baixar o app' },
  'cta.ai': { ar: 'توقعات AI', en: 'AI Predictions', es: 'Predicciones IA', ru: 'AI-прогнозы', fr: 'Prédictions IA', de: 'KI-Prognosen', tr: 'YZ Tahminleri', pt: 'Previsões de IA' },

  // ---------- Guides chrome ----------
  'guides.brand_line': { ar: 'هذا الدليل من <strong>{brand}</strong> — {tagline}. {intro}', en: 'This guide is from <strong>{brand}</strong> — {tagline}. {intro}', es: 'Esta guía es de <strong>{brand}</strong> — {tagline}. {intro}', ru: 'Это руководство от <strong>{brand}</strong> — {tagline}. {intro}', fr: 'Ce guide vient de <strong>{brand}</strong> — {tagline}. {intro}', de: 'Dieser Leitfaden stammt von <strong>{brand}</strong> — {tagline}. {intro}', tr: 'Bu rehber <strong>{brand}</strong> tarafından — {tagline}. {intro}', pt: 'Este guia é da <strong>{brand}</strong> — {tagline}. {intro}' },
  'guides.steps_title': { ar: 'الخطوات', en: 'Steps', es: 'Pasos', ru: 'Шаги', fr: 'Étapes', de: 'Schritte', tr: 'Adımlar', pt: 'Etapas' },
  'guides.faq_title': { ar: 'الأسئلة الشائعة', en: 'Frequently Asked Questions', es: 'Preguntas frecuentes', ru: 'Частые вопросы', fr: 'Questions fréquentes', de: 'Häufige Fragen', tr: 'Sık Sorulan Sorular', pt: 'Perguntas frequentes' },
  'guides.cta_home': { ar: 'الصفحة الرئيسية', en: 'Home Page', es: 'Página de inicio', ru: 'Главная страница', fr: 'Page d’accueil', de: 'Startseite', tr: 'Ana Sayfa', pt: 'Página inicial' },
  'guides.related_title': { ar: 'أدلة ذات صلة', en: 'Related Guides', es: 'Guías relacionadas', ru: 'Похожие руководства', fr: 'Guides associés', de: 'Verwandte Leitfäden', tr: 'İlgili Rehberler', pt: 'Guias relacionados' },

  // ---------- Hub pages (/companies, /guides) ----------
  'hub.companies_h1': {
    ar: 'دليل شركات المراهنات المعتمدة',
    en: 'Approved Betting Companies Directory',
    es: 'Directorio de casas de apuestas aprobadas',
    ru: 'Каталог одобренных букмекеров',
    fr: 'Répertoire des bookmakers agréés',
    de: 'Verzeichnis freigegebener Wettanbieter',
    tr: 'Onaylı Bahis Şirketleri Dizini',
    pt: 'Diretório de casas de apostas aprovadas',
  },
  'hub.companies_desc': {
    ar: 'قارن أكواد الخصم، نسب التعويض، وسرعة التحويل لكل شركة معتمدة عبر {brand} مع روابط مخصصة لكل شركة.',
    en: 'Compare promo codes, compensation rates and payout speed for every approved company via {brand}, with a dedicated page for each.',
    es: 'Compara códigos de descuento, tasas de compensación y velocidad de pago de cada empresa aprobada vía {brand}, con página dedicada.',
    ru: 'Сравните промокоды, проценты компенсации и скорость выплат каждой одобренной компании через {brand}, у каждой есть отдельная страница.',
    fr: 'Comparez codes promo, taux d’indemnisation et rapidité de paiement de chaque société approuvée via {brand}, avec une page dédiée.',
    de: 'Vergleiche Promo-Codes, Erstattungsquoten und Auszahlungsgeschwindigkeit aller freigegebenen Unternehmen über {brand} — jede hat eine eigene Seite.',
    tr: '{brand} üzerinden onaylı her şirketin promosyon kodlarını, tazminat oranlarını ve ödeme hızını karşılaştırın — her biri için özel sayfa.',
    pt: 'Compare códigos promocionais, taxas de compensação e velocidade de pagamento de cada empresa aprovada via {brand}, com página dedicada.',
  },
  'hub.guides_h1': {
    ar: 'كل الأدلة والشروحات',
    en: 'All Guides & Tutorials',
    es: 'Todas las guías y tutoriales',
    ru: 'Все руководства и инструкции',
    fr: 'Tous les guides et tutoriels',
    de: 'Alle Leitfäden und Tutorials',
    tr: 'Tüm Rehberler ve Eğiticiler',
    pt: 'Todos os guias e tutoriais',
  },
  'hub.guides_desc': {
    ar: 'أدلة خطوة بخطوة عن التعويضات، فك التجميد، توقعات الذكاء الاصطناعي، اليانصيب العادل، بونص 1xBet وتتبّع المحافظ.',
    en: 'Step-by-step guides on compensation, unfreezing, AI predictions, fair lottery, 1xBet bonuses and wallet tracking.',
    es: 'Guías paso a paso sobre compensación, desbloqueo, predicciones IA, lotería justa, bonos 1xBet y seguimiento de carteras.',
    ru: 'Пошаговые руководства по компенсации, разморозке, AI-прогнозам, честной лотерее, бонусам 1xBet и отслеживанию кошельков.',
    fr: 'Guides étape par étape : indemnisation, déblocage, prédictions IA, loteria équitable, bonus 1xBet et suivi des portefeuilles.',
    de: 'Schritt-für-Schritt-Leitfäden zu Erstattung, Entsperren, KI-Prognosen, faires Lotto, 1xBet-Boni und Wallet-Tracking.',
    tr: 'Tazminat, kilitleme açma, YZ tahminleri, adil piyango, 1xBet bonusları ve cüzdan takibi üzerine adım adım rehberler.',
    pt: 'Guias passo a passo sobre compensação, desbloqueio, previsões de IA, loteria justa, bônus 1xBet e acompanhamento de carteiras.',
  },
  'hub.companies_note': {
    ar: 'انقر على أي شركة لعرض صفحة التعويض الكاملة والكود الترويجي.',
    en: 'Click any company for its full compensation page and promo code.',
    es: 'Haz clic en cualquier empresa para ver su página completa de compensación y código promocional.',
    ru: 'Нажмите на компанию, чтобы открыть полную страницу компенсации и промокод.',
    fr: 'Cliquez sur une société pour voir sa page complète et son code promo.',
    de: 'Klicke auf ein Unternehmen für die vollständige Erstattungsseite und den Promo-Code.',
    tr: 'Herhangi bir şirkete tıklayarak tam tazminat sayfasını ve promosyon kodunu görün.',
    pt: 'Clique em qualquer empresa para ver sua página completa de compensação e código promocional.',
  },


  // ---------- Predictions list ----------
  'pred.list_h1': { ar: 'توقعات المباريات بالذكاء الاصطناعي', en: 'AI Football Match Predictions', es: 'Predicciones de fútbol con IA', ru: 'AI-прогнозы футбольных матчей', fr: 'Prédictions de football par IA', de: 'KI-Fußballspielprognosen', tr: 'Yapay Zeka Futbol Maç Tahminleri', pt: 'Previsões de futebol com IA' },
  'pred.list_desc': { ar: 'توقعات مباريات اليوم والغد بالذكاء الاصطناعي: احتمالات فوز، نتائج متوقعة، وتحليلات تكتيكيّة لأفضل الدوريات على {brand}.', en: 'AI predictions for today and tomorrow\'s matches: win probabilities, predicted scores, and tactical analysis of top leagues on {brand}.', es: 'Predicciones de IA para los partidos de hoy y mañana: probabilidades de victoria, resultados previstos y análisis táctico de las mejores ligas en {brand}.', ru: 'AI-прогнозы матчей сегодня и завтра: вероятности побед, прогнозы счета и тактический анализ топ-лиг на {brand}.', fr: 'Prédictions IA pour les matchs d’aujourd’hui et de demain : probabilités de victoire, scores prévus et analyse tactique des grands championnats sur {brand}.', de: 'KI-Prognosen für heute und morgen: Siegwahrscheinlichkeiten, TorgPrognosen und taktische Analysen der Top-Ligen auf {brand}.', tr: '{brand} üzerinde bugün ve yarınki maçlar için YZ tahminleri: kazanma olasılıkları, skor tahminleri ve üst liglerin taktik analizleri.', pt: 'Previsões de IA para os jogos de hoje e amanhã: probabilidades de vitória, placares previstos e análise tática das principais ligas na {brand}.' },
  'pred.today_h1': { ar: 'توقعات اليوم', en: "Today's AI Predictions", es: 'Predicciones de IA de hoy', ru: 'Прогнозы на сегодня', fr: "Prédictions IA d'aujourd'hui", de: 'KI-Prognosen für heute', tr: 'Bugünün YZ Tahminleri', pt: 'Previsões de IA de hoje' },
  'pred.tomorrow_h1': { ar: 'توقعات الغد', en: "Tomorrow's AI Predictions", es: 'Predicciones de IA de mañana', ru: 'Прогнозы на завтра', fr: 'Prédictions IA de demain', de: 'KI-Prognosen für morgen', tr: 'Yarının YZ Tahminleri', pt: 'Previsões de IA de amanhã' },
  'pred.day_h1': { ar: 'توقعات يوم', en: 'AI Predictions for', es: 'Predicciones de IA del', ru: 'Прогнозы на', fr: 'Prédictions IA du', de: 'KI-Prognosen für den', tr: 'Tahminler:', pt: 'Previsões de IA do dia' },
  'pred.day_desc': { ar: 'احتمالات الفوز والنتائج المتوقعة وتحليلات تكتيكيّة لمباريات {date} على {brand}.', en: 'Win probabilities, predicted scores and tactical analysis for every match on {date} — {brand}.', es: 'Probabilidades de victoria, resultados previstos y análisis táctico de todos los partidos del {date} — {brand}.', ru: 'Вероятности побед, прогнозы счёта и тактический анализ всех матчей {date} — {brand}.', fr: 'Probabilités de victoire, scores prévus et analyse tactique de tous les matchs du {date} — {brand}.', de: 'Siegwahrscheinlichkeiten, TorgPrognosen und taktische Analyse aller Spiele am {date} — {brand}.', tr: '{date} tarihli tüm maçlar için kazanma olasılıkları, skor tahminleri ve taktik analiz — {brand}.', pt: 'Probabilidades de vitória, placares previstos e análise tática de todos os jogos de {date} — {brand}.' },
  'pred.list_note': { ar: 'كل صفحة توقعات تحتوي على احتمالات فوز، النتيجة المتوقعة، وتحليل تكتيكي مُولّد لحظياً — محدّث يومياً لأفضل الدوريات في العالم.', en: 'Each prediction page includes win probabilities, a predicted score, and an instant tactical analysis — updated daily for the world\'s top leagues.', es: 'Cada página de predicciones incluye probabilidades de victoria, resultado previsto y análisis táctico instantáneo — actualizado a diario para las mejores ligas.', ru: 'Каждая страница прогнозов содержит вероятности побед, прогноз счёта и мгновенный тактический анализ — обновляется ежедневно для топ-лиг мира.', fr: 'Chaque page de prédictions contient les probabilités de victoire, un score prévu et une analyse tactique instantanée — mise à jour chaque jour pour les grands championnats.', de: 'Jede Prognoseseite enthält Siegwahrscheinlichkeiten, eine TorgPrognose und eine sofortige taktische Analyse — täglich aktualisiert für die Top-Ligen.', tr: 'Her tahmin sayfası kazanma olasılıkları, skor tahmini ve anlık taktik analiz içerir — dünyanın en üst ligleri için her gün güncellenir.', pt: 'Cada página de previsões traz probabilidades de vitória, placar previsto e análise tática instantânea — atualizada diariamente para as melhores ligas.' },
  'pred.updated_note': { ar: 'محدّث يومياً', en: 'Updated daily', es: 'Actualizado a diario', ru: 'Обновляется ежедневно', fr: 'Mis à jour chaque jour', de: 'Täglich aktualisiert', tr: 'Her gün güncellenir', pt: 'Atualizado diariamente' },
  'pred.kickoff': { ar: 'انطلاق', en: 'Kick-off', es: 'Inicio', ru: 'Начало', fr: 'Coup d’envoi', de: 'Anstoß', tr: 'Başlangıç', pt: 'Início' },
  'pred.ai_badge': { ar: 'Gemini AI', en: 'Gemini AI', es: 'Gemini AI', ru: 'Gemini AI', fr: 'Gemini AI', de: 'Gemini AI', tr: 'Gemini AI', pt: 'Gemini AI' },

  // ---------- Predictions detail ----------
  'pred.probs_title': { ar: 'احتمالات المباراة', en: 'Match Probabilities', es: 'Probabilidades del partido', ru: 'Вероятности матча', fr: 'Probabilités du match', de: 'Spielwahrscheinlichkeiten', tr: 'Maç Olasılıkları', pt: 'Probabilidades do jogo' },
  'pred.prob_home': { ar: 'فوز {team}', en: '{team} win', es: 'Victoria de {team}', ru: 'Победа {team}', fr: 'Victoire de {team}', de: 'Sieg {team}', tr: '{team} galibiyeti', pt: 'Vitória do(a) {team}' },
  'pred.prob_draw': { ar: 'تعادل', en: 'Draw', es: 'Empate', ru: 'Ничья', fr: 'Match nul', de: 'Unentschieden', tr: 'Beraberlik', pt: 'Empate' },
  'pred.prob_away': { ar: 'فوز {team}', en: '{team} win', es: 'Victoria de {team}', ru: 'Победа {team}', fr: 'Victoire de {team}', de: 'Sieg {team}', tr: '{team} galibiyeti', pt: 'Vitória do(a) {team}' },
  'pred.score': { ar: 'النتيجة المتوقعة', en: 'Predicted Score', es: 'Resultado previsto', ru: 'Прогнозируемый счёт', fr: 'Score prévu', de: 'TorgPrognose', tr: 'Tahmini Skor', pt: 'Placar previsto' },
  'pred.analysis': { ar: 'التحليل التكتيكي', en: 'Tactical Analysis', es: 'Análisis táctico', ru: 'Тактический анализ', fr: 'Analyse tactique', de: 'Taktische Analyse', tr: 'Taktik Analiz', pt: 'Análise tática' },
  'pred.recommendation': { ar: 'التوصية', en: 'Recommendation', es: 'Recomendación', ru: 'Рекомендация', fr: 'Recommandation', de: 'Empfehlung', tr: 'Öneri', pt: 'Recomendação' },
  'pred.risk': { ar: 'مستوى المخاطرة', en: 'Risk Level', es: 'Nivel de riesgo', ru: 'Уровень риска', fr: 'Niveau de risque', de: 'Risikostufe', tr: 'Risk Seviyesi', pt: 'Nível de risco' },
  'pred.confidence': { ar: 'مؤشر الثقة', en: 'Confidence Score', es: 'Índice de confianza', ru: 'Уверенность', fr: 'Indice de confiance', de: 'Konfidenzwert', tr: 'Güven Skoru', pt: 'Índice de confiança' },
  'pred.ratings': { ar: 'تصنيف الفريقين', en: 'Team Ratings', es: 'Clasificaciones de equipos', ru: 'Рейтинги команд', fr: 'Classements des équipes', de: 'Team-Bewertungen', tr: 'Takım Sıralamaları', pt: 'Classificações das equipes' },
  'pred.faq1q': { ar: 'من هو المرشح للفوز في {home} ضد {away}؟', en: 'Who is favored to win {home} vs {away}?', es: '¿Quién es favorito en {home} contra {away}?', ru: 'Кто фаворит в матче {home} против {away}?', fr: 'Qui est favori entre {home} et {away} ?', de: 'Wer ist Favorit bei {home} gegen {away}?', tr: '{home} - {away} maçında favori kim?', pt: 'Quem é favorito em {home} x {away}?' },
  'pred.faq2q': { ar: 'ما هي النتيجة المتوقعة لمباراة {home} ضد {away}؟', en: 'What is the predicted score for {home} vs {away}?', es: '¿Cuál es el resultado previsto de {home} contra {away}?', ru: 'Какой прогнозируемый счёт в матче {home} против {away}?', fr: 'Quel est le score prévu pour {home} contre {away} ?', de: 'Wie lautet die TorgPrognose für {home} gegen {away}?', tr: '{home} - {away} maçı için tahmini skor nedir?', pt: 'Qual é o placar previsto para {home} x {away}?' },
  'pred.faq3q': { ar: 'ما مستوى المخاطرة في توقع {home} ضد {away}؟', en: 'What is the risk level for the {home} vs {away} prediction?', es: '¿Cuál es el nivel de riesgo de la predicción {home} contra {away}?', ru: 'Каков уровень риска прогноза {home} против {away}?', fr: 'Quel est le niveau de risque de la prévision {home} contre {away} ?', de: 'Wie hoch ist das Risiko der Prognose {home} gegen {away}?', tr: '{home} - {away} tahmini için risk seviyesi nedir?', pt: 'Qual é o nível de risco da previsão {home} x {away}?' },
  'pred.related': { ar: 'توقعات ذات صلة', en: 'Related Predictions', es: 'Predicciones relacionadas', ru: 'Похожие прогнозы', fr: 'Prédictions associées', de: 'Ähnliche Prognosen', tr: 'İlgili Tahminler', pt: 'Previsões relacionadas' },
  'pred.cta_all': { ar: 'كل التوقعات', en: 'All Predictions', es: 'Todas las predicciones', ru: 'Все прогнозы', fr: 'Toutes les prédictions', de: 'Alle Prognosen', tr: 'Tüm Tahminler', pt: 'Todas as previsões' },
  'pred.cta_guide': { ar: 'دليل قراءة التوقعات', en: 'How to Read Predictions', es: 'Cómo leer las predicciones', ru: 'Как читать прогнозы', fr: 'Comment lire les prédictions', de: 'Prognosen richtig lesen', tr: 'Tahminleri Okuma Rehberi', pt: 'Como ler as previsões' },
  'pred.breadcrumb': { ar: 'توقعات المباريات', en: 'Match Predictions', es: 'Predicciones de partidos', ru: 'Прогнозы матчей', fr: 'Prédictions de matchs', de: 'Spielprognosen', tr: 'Maç Tahminleri', pt: 'Previsões de jogos' },
};

export function t(key: string, lang: Lang, vars?: Record<string, string>): string {
  const row = T[key];
  let s = row ? (row[lang] || row['ar'] || '') : '';
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v);
  return s;
}

// Extra chrome keys (added separately to keep the main table readable)
const T2: Record<string, Row> = {
  'nav.home': { ar: 'الرئيسية', en: 'Home', es: 'Inicio', ru: 'Главная', fr: 'Accueil', de: 'Start', tr: 'Ana Sayfa', pt: 'Início' },
  'nav.companies': { ar: 'الشركات', en: 'Companies', es: 'Compañías', ru: 'Компании', fr: 'Sociétés', de: 'Unternehmen', tr: 'Şirketler', pt: 'Empresas' },
  'nav.wallets': { ar: 'المحافظ', en: 'Wallets', es: 'Carteras', ru: 'Кошельки', fr: 'Portefeuilles', de: 'Wallets', tr: 'Cüzdanlar', pt: 'Carteiras' },
  'nav.predictions': { ar: 'التوقعات', en: 'Predictions', es: 'Predicciones', ru: 'Прогнозы', fr: 'Prédictions', de: 'Prognosen', tr: 'Tahminler', pt: 'Previsões' },
  'nav.lottery': { ar: 'اليانصيب', en: 'Lottery', es: 'Lotería', ru: 'Лотерея', fr: 'Loterie', de: 'Lotto', tr: 'Piyango', pt: 'Loteria' },
  'nav.download': { ar: 'تحميل APK', en: 'Download APK', es: 'Descargar APK', ru: 'Скачать APK', fr: 'Télécharger l’APK', de: 'APK herunterladen', tr: 'APK İndir', pt: 'Baixar APK' },
  'faq.q_prefix': { ar: 'س:', en: 'Q:', es: 'P:', ru: 'В:', fr: 'Q :', de: 'F:', tr: 'S:', pt: 'P:' },
  'company.footer_page': { ar: 'صفحة {name} — آخر تحديث:', en: 'Page for {name} — last updated:', es: 'Página de {name} — última actualización:', ru: 'Страница {name} — последнее обновление:', fr: 'Page {name} — dernière mise à jour :', de: 'Seite für {name} — zuletzt aktualisiert:', tr: '{name} sayfası — son güncelleme:', pt: 'Página da {name} — última atualização:' },
  'company.updated_only': { ar: 'آخر تحديث:', en: 'Last updated:', es: 'Última actualización:', ru: 'Последнее обновление:', fr: 'Dernière mise à jour :', de: 'Zuletzt aktualisiert:', tr: 'Son güncelleme:', pt: 'Última atualização:' },
  'pred.qa_prefix': { ar: 'س:', en: 'Q:', es: 'P:', ru: 'В:', fr: 'Q :', de: 'F:', tr: 'S:', pt: 'P:' },
  'pred.faq_risk_note': { ar: 'ثقة {confidence}% والتوصية: {pick}', en: 'confidence {confidence}% and recommendation: {pick}', es: 'confianza {confidence}% y recomendación: {pick}', ru: 'уверенность {confidence}% и рекомендация: {pick}', fr: 'confiance {confidence} % et recommandation : {pick}', de: 'Konfidenz {confidence} % und Empfehlung: {pick}', tr: 'güven {confidence}% ve öneri: {pick}', pt: 'confiança {confidence}% e recomendação: {pick}' },
  'pred.fav_note': { ar: 'الترجيح يميل لـ {favorite} بنسبة {prob}%', en: 'The edge favors {favorite} at {prob}%', es: 'La ventaja favorece a {favorite} con un {prob}%', ru: 'Преимущество у {favorite} с {prob}%', fr: 'L’avantage va à {favorite} à {prob}%', de: 'Der Vorteil liegt bei {favorite} mit {prob}%', tr: 'Avantaj {favorite} lehine % {prob}', pt: 'A vantagem é de {favorite} com {prob}%' },
  'pred.draw_note': { ar: 'النتيجة المتوقعة {score} لصالح {favorite}.', en: 'The predicted score is {score} in favor of {favorite}.', es: 'El resultado previsto es {score} a favor de {favorite}.', ru: 'Прогнозируемый счёт {score} в пользу {favorite}.', fr: 'Le score prévu est {score} en faveur de {favorite}.', de: 'Die TorgPrognose lautet {score} für {favorite}.', tr: 'Tahmini skor {favorite} lehine {score}.', pt: 'O placar previsto é {score} a favor do(a) {favorite}.' },
  'pred.reco_note': { ar: 'التوصية: {pick}', en: 'Recommendation: {pick}', es: 'Recomendación: {pick}', ru: 'Рекомендация: {pick}', fr: 'Recommandation : {pick}', de: 'Empfehlung: {pick}', tr: 'Öneri: {pick}', pt: 'Recomendação: {pick}' },
  'pred.risk_note': { ar: 'مستوى المخاطرة {risk}', en: 'Risk level {risk}', es: 'Nivel de riesgo {risk}', ru: 'Уровень риска {risk}', fr: 'Niveau de risque {risk}', de: 'Risikostufe {risk}', tr: 'Risk seviyesi {risk}', pt: 'Nível de risco {risk}' },
  'pred.preds_label': { ar: 'التوقعات', en: 'Predictions', es: 'Predicciones', ru: 'Прогнозы', fr: 'Prédictions', de: 'Prognosen', tr: 'Tahminler', pt: 'Previsões' },
  'risk.low': { ar: 'منخفضة', en: 'Low', es: 'Bajo', ru: 'Низкий', fr: 'Faible', de: 'Niedrig', tr: 'Düşük', pt: 'Baixo' },
  'risk.medium': { ar: 'متوسطة', en: 'Medium', es: 'Medio', ru: 'Средний', fr: 'Moyen', de: 'Mittel', tr: 'Orta', pt: 'Médio' },
  'risk.high': { ar: 'عالية', en: 'High', es: 'Alto', ru: 'Высокий', fr: 'Élevé', de: 'Hoch', tr: 'Yüksek', pt: 'Alto' },
  'pred.vs_note': { ar: '{home} ({hr}) مقابل {away} ({ar}) — {fav_note}، {score_note}', en: '{home} ({hr}) vs {away} ({ar}) — {fav_note}, {score_note}', es: '{home} ({hr}) contra {away} ({ar}) — {fav_note}, {score_note}', ru: '{home} ({hr}) против {away} ({ar}) — {fav_note}, {score_note}', fr: '{home} ({hr}) contre {away} ({ar}) — {fav_note}, {score_note}', de: '{home} ({hr}) gegen {away} ({ar}) — {fav_note}, {score_note}', tr: '{home} ({hr}) - {away} ({ar}) — {fav_note}, {score_note}', pt: '{home} ({hr}) x {away} ({ar}) — {fav_note}, {score_note}' },
  'pred.meta_desc': { ar: 'توقعات {home} ضد {away} بتاريخ {date}: احتمال الفوز {ph}% مقابل {pa}%، النتيجة المتوقعة {score}، وثقة {confidence}%.', en: 'Predictions for {home} vs {away} on {date}: {ph}% win probability vs {pa}%, predicted score {score}, confidence {confidence}%.', es: 'Predicciones de {home} contra {away} el {date}: {ph}% de probabilidad de victoria frente a {pa}%, resultado previsto {score}, confianza {confidence}%.', ru: 'Прогнозы {home} против {away} на {date}: вероятность победы {ph}% против {pa}%, прогноз счёта {score}, уверенность {confidence}%.', fr: 'Prédictions {home} contre {away} le {date} : {ph} % de probabilité de victoire contre {pa} %, score prévu {score}, confiance {confidence} %.', de: 'Prognosen für {home} gegen {away} am {date}: {ph} % Siegwahrscheinlichkeit gegenüber {pa} %, TorgPrognose {score}, Konfidenz {confidence} %.', tr: '{date} tarihli {home} - {away} tahminleri: {ph}% kazanma olasılığı - {pa}%, tahmini skor {score}, güven {confidence}%.', pt: 'Previsões de {home} x {away} em {date}: {ph}% de probabilidade de vitória contra {pa}%, placar previsto {score}, confiança {confidence}%.' },
  'pred.title_tpl': { ar: '{home} ضد {away} توقعات — {date} احتمالات ونتيجة متوقعة', en: '{home} vs {away} Predictions — {date} probabilities & predicted score', es: 'Predicciones de {home} contra {away} — {date}: probabilidades y resultado previsto', ru: 'Прогнозы {home} против {away} — {date}: вероятности и прогноз счёта', fr: 'Prédictions {home} contre {away} — {date} : probabilités et score prévu', de: '{home} gegen {away} Prognosen — {date}: Wahrscheinlichkeiten und TorgPrognose', tr: '{home} - {away} Tahminleri — {date}: olasılıklar ve tahmini skor', pt: 'Previsões de {home} x {away} — {date}: probabilidades e placar previsto' },
  'pred.og_desc': { ar: 'احتمال الفوز {ph}% مقابل {pa}% — النتيجة المتوقعة {score}', en: 'Win probability {ph}% vs {pa}% — predicted score {score}', es: 'Probabilidad de victoria {ph}% frente a {pa}% — resultado previsto {score}', ru: 'Вероятность победы {ph}% против {pa}% — прогноз счёта {score}', fr: 'Probabilité de victoire {ph} % contre {pa} % — score prévu {score}', de: 'Siegwahrscheinlichkeit {ph} % gegenüber {pa} % — TorgPrognose {score}', tr: 'Kazanma olasılığı {ph}% - {pa}% — tahmini skor {score}', pt: 'Probabilidade de vitória {ph}% contra {pa}% — placar previsto {score}' },
};

export function t2(key: string, lang: Lang, vars?: Record<string, string>): string {
  const row = T2[key];
  let s = row ? (row[lang] || row['ar'] || '') : '';
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v);
  return s;
}

// combined lookup used by server routes
export function tt(key: string, lang: Lang, vars?: Record<string, string>): string {
  const row = T[key] || T2[key];
  let s = row ? (row[lang] || row['ar'] || '') : '';
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v);
  return s;
}
