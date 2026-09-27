// How-to guide content translated for all 8 languages (GEO answer-engine optimized)

export type GuideLang = { title: string; desc: string; steps: string[]; faq: { q: string; a: string }[] };
export type Guide = Record<string, GuideLang>;

export const GUIDES: Record<string, Guide> = {
  'claim-compensation': {
    ar: {
      title: 'كيف تحصل على تعويض المراهنات — دليل خطوة بخطوة 2026',
      desc: 'دليل شامل للحصول على تعويض خسائر المراهنات عبر VEX Deals مع نسب حقيقية وتحويلات فورية.',
      steps: [
        'سجّل حسابك في VEX Deals مجاناً',
        'اختر شركة المراهنات من قائمة الشركات المعتمدة',
        'أدخل رمز الإحالة الخاص بك ووثّق رصيدك',
        'قدّم طلب التعويض مع إثبات الخسارة',
        'استلم نسبتك تُضاف لرصيدك المجمد',
        'حوّل التعويض لحسابك البنكي أو محفظتك',
      ],
      faq: [
        { q: 'كم نسبة التعويض؟', a: 'تتراوح النسبة بين 10% و 50% حسب نوع الخسارة وسياسة الشركة.' },
        { q: 'هل التعويض مجاني؟', a: 'نعم، خدمة التعويض عبر VEX Deals مجانية 100%.' },
        { q: 'كم يستغرق الوصول؟', a: 'عادة خلال 24 ساعة كحد أقصى.' },
      ],
    },
    en: {
      title: 'How to Claim Betting Compensation — Step-by-Step Guide 2026',
      desc: 'A complete guide to claiming betting loss compensation with real percentages and instant transfers.',
      steps: [
        'Create your free account',
        'Choose a licensed betting company from the list',
        'Enter your referral code and verify your balance',
        'Submit the compensation request with proof of loss',
        'Receive your percentage added to your frozen balance',
        'Transfer the compensation to your bank account or wallet',
      ],
      faq: [
        { q: 'What compensation percentage do I get?', a: 'Percentages range from 10% to 50% depending on the loss type and company policy.' },
        { q: 'Is compensation free?', a: 'Yes, claiming compensation is 100% free.' },
        { q: 'How long does it take?', a: 'Usually within 24 hours at most.' },
      ],
    },
    es: {
      title: 'Cómo reclamar compensación de apuestas — Guía paso a paso 2026',
      desc: 'Guía completa para reclamar compensación por pérdidas de apuestas con porcentajes reales y transferencias instantáneas.',
      steps: [
        'Crea tu cuenta gratis',
        'Elige una casa de apuestas licenciada de la lista',
        'Introduce tu código de referido y verifica tu saldo',
        'Envía la solicitud de compensación con prueba de la pérdida',
        'Recibe tu porcentaje añadido a tu saldo congelado',
        'Transfiere la compensación a tu banco o cartera',
      ],
      faq: [
        { q: '¿Qué porcentaje de compensación recibo?', a: 'Los porcentajes van del 10% al 50% según el tipo de pérdida y la política de la empresa.' },
        { q: '¿La compensación es gratis?', a: 'Sí, solicitar compensación es 100% gratuito.' },
        { q: '¿Cuánto tarda?', a: 'Normalmente un máximo de 24 horas.' },
      ],
    },
    ru: {
      title: 'Как получить компенсацию за ставки — пошаговое руководство 2026',
      desc: 'Полное руководство по получению компенсации проигрышей ставок с реальными процентами и мгновенными переводами.',
      steps: [
        'Создайте бесплатный аккаунт',
        'Выберите лицензированного букмекера из списка',
        'Введите реферальный код и подтвердите баланс',
        'Отправьте запрос на компенсацию с подтверждением потерь',
        'Получите процент, добавленный к замороженному балансу',
        'Переведите компенсацию на банковский счёт или кошелёк',
      ],
      faq: [
        { q: 'Какой процент компенсации я получу?', a: 'Проценты составляют от 10% до 50% в зависимости от типа потерь и политики компании.' },
        { q: 'Компенсация бесплатна?', a: 'Да, получение компенсации на 100% бесплатно.' },
        { q: 'Сколько это занимает?', a: 'Обычно максимум 24 часа.' },
      ],
    },
    fr: {
      title: 'Comment obtenir une indemnisation de paris — guide pas à pas 2026',
      desc: 'Guide complet pour obtenir une indemnisation des pertes de paris avec des pourcentages réels et des transferts instantanés.',
      steps: [
        'Créez votre compte gratuitement',
        'Choisissez un bookmaker agréé dans la liste',
        'Saisissez votre code de parrainage et vérifiez votre solde',
        'Envoyez la demande d’indemnisation avec la preuve de la perte',
        'Recevez votre pourcentage ajouté à votre solde gelé',
        'Transférez l’indemnisation vers votre banque ou portefeuille',
      ],
      faq: [
        { q: 'Quel pourcentage d’indemnisation vais-je recevoir ?', a: 'Les pourcentages vont de 10 % à 50 % selon le type de perte et la politique de la société.' },
        { q: 'L’indemnisation est-elle gratuite ?', a: 'Oui, la demande d’indemnisation est 100 % gratuite.' },
        { q: 'Combien de temps cela prend-il ?', a: 'Généralement 24 heures au maximum.' },
      ],
    },
    de: {
      title: 'So fordern Sie Wett-Erstattungen an — Schritt-für-Schritt 2026',
      desc: 'Ein vollständiger Leitfaden zur Erstattung von Wettverlusten mit echten Prozentsätzen und Sofortüberweisungen.',
      steps: [
        'Erstellen Sie Ihr kostenloses Konto',
        'Wählen Sie einen lizenzierten Wettanbieter aus der Liste',
        'Geben Sie Ihren Empfehlungscode ein und bestätigen Sie Ihr Guthaben',
        'Senden Sie den Erstattungsantrag mit Verlustnachweis',
        'Erhalten Sie Ihren Prozentsatz auf Ihrem eingefrorenen Guthaben',
        'Überweisen Sie die Erstattung auf Ihr Bankkonto oder Wallet',
      ],
      faq: [
        { q: 'Welchen Erstattungsprozentsatz erhalte ich?', a: 'Die Prozentsätze liegen zwischen 10 % und 50 %, je nach Verlustart und Unternehmensrichtlinie.' },
        { q: 'Ist die Erstattung kostenlos?', a: 'Ja, die Erstattung ist zu 100 % kostenlos.' },
        { q: 'Wie lange dauert es?', a: 'Normalerweise höchstens 24 Stunden.' },
      ],
    },
    tr: {
      title: 'Bahis Tazminatı Nasıl Alınır — Adım Adım Rehber 2026',
      desc: 'Gerçek yüzdeler ve anında transferlerle bahis kayıp tazminatı almak için kapsamlı rehber.',
      steps: [
        'Ücretsiz hesabınızı oluşturun',
        'Listeden lisanslı bir bahis şirketi seçin',
        'Referans kodunuzu girin ve bakiyenizi doğrulayın',
        'Kayıp kanıtıyla tazminat talebini gönderin',
        'Yüzde payınızı dondurulmuş bakiyenize ekleyin',
        'Tazminatı banka hesabınıza veya cüzdanınıza aktarın',
      ],
      faq: [
        { q: 'Ne kadar tazminat yüzdesi alırım?', a: 'Yüzdeler kayıp türüne ve şirket politikasına göre %10 ile %50 arasında değişir.' },
        { q: 'Tazminat ücretsiz mi?', a: 'Evet, tazminat talebi %100 ücretsizdir.' },
        { q: 'Ne kadar sürer?', a: 'Genellikle en fazla 24 saat.' },
      ],
    },
    pt: {
      title: 'Como solicitar compensação de apostas — guia passo a passo 2026',
      desc: 'Guia completo para solicitar compensação de perdas em apostas com percentuais reais e transferências instantâneas.',
      steps: [
        'Crie sua conta grátis',
        'Escolha uma casa de apostas licenciada da lista',
        'Informe seu código de indicação e confirme seu saldo',
        'Envie a solicitação de compensação com prova da perda',
        'Receba seu percentual adicionado ao saldo congelado',
        'Transfira a compensação para seu banco ou carteira',
      ],
      faq: [
        { q: 'Qual percentual de compensação recebo?', a: 'Os percentuais variam de 10% a 50%, conforme o tipo de perda e a política da empresa.' },
        { q: 'A compensação é gratuita?', a: 'Sim, solicitar compensação é 100% gratuito.' },
        { q: 'Quanto tempo leva?', a: 'Normalmente no máximo 24 horas.' },
      ],
    },
  },
  'unfreeze-balance': {
    ar: {
      title: 'كيف فك تجميد الرصيد في VEX Deals — دليل كامل',
      desc: 'خطوات فك تجميد الرصيد عبر الإيداع المباشر 1:1 أو نظام الإحالات.',
      steps: [
        'افتح تبويب المحافظ في VEX Deals',
        'اختر "فك التجميد" أو "Direct Deposit Unfreeze"',
        'أدخل المبلغ المراد فك تجميده',
        'أرسل المبلغ بنفس القيمة للحساب المحدد',
        'ارفع إثبات التحويل',
        'يتم فك التجميد فوراً بنسبة 1:1',
      ],
      faq: [
        { q: 'هل فيه رسوم على فك التجميد؟', a: 'لا، فك التجميد المجاني تماماً.' },
        { q: 'هل فيه حد أدنى؟', a: 'الحد الأدنى يعتمد على نوع المحفظة.' },
      ],
    },
    en: {
      title: 'How to Unfreeze Your Balance in VEX Deals — Full Guide',
      desc: 'Steps to unfreeze your balance via 1:1 direct deposit or the referral system.',
      steps: [
        'Open the Wallets tab',
        'Choose "Unfreeze" or "Direct Deposit Unfreeze"',
        'Enter the amount you want to unfreeze',
        'Send the same amount to the specified account',
        'Upload proof of the transfer',
        'Your balance is unfrozen instantly at 1:1',
      ],
      faq: [
        { q: 'Are there fees to unfreeze?', a: 'No, unfreezing is completely free.' },
        { q: 'Is there a minimum?', a: 'The minimum depends on the wallet type.' },
      ],
    },
    es: {
      title: 'Cómo desbloquear tu saldo en VEX Deals — guía completa',
      desc: 'Pasos para desbloquear tu saldo mediante depósito directo 1:1 o el sistema de referidos.',
      steps: [
        'Abre la pestaña de carteras',
        'Elige "Desbloquear" o "Direct Deposit Unfreeze"',
        'Introduce el saldo que quieres desbloquear',
        'Envía la misma cantidad a la cuenta indicada',
        'Sube el comprobante de la transferencia',
        'Tu saldo se desbloquea al instante con relación 1:1',
      ],
      faq: [
        { q: '¿Hay comisiones por desbloquear?', a: 'No, desbloquear es totalmente gratuito.' },
        { q: '¿Hay un mínimo?', a: 'El mínimo depende del tipo de cartera.' },
      ],
    },
    ru: {
      title: 'Как разморозить баланс в VEX Deals — полное руководство',
      desc: 'Шаги по разморозке баланса через прямой депозит 1:1 или реферальную систему.',
      steps: [
        'Откройте вкладку кошельков',
        'Выберите «Разморозить» или «Direct Deposit Unfreeze»',
        'Введите сумму, которую хотите разморозить',
        'Отправьте ту же сумму на указанный счёт',
        'Загрузите подтверждение перевода',
        'Баланс размораживается мгновенно по курсу 1:1',
      ],
      faq: [
        { q: 'Есть ли комиссия за разморозку?', a: 'Нет, разморозка полностью бесплатна.' },
        { q: 'Есть ли минимальная сумма?', a: 'Минимум зависит от типа кошелька.' },
      ],
    },
    fr: {
      title: 'Comment débloquer votre solde sur VEX Deals — guide complet',
      desc: 'Étapes pour débloquer votre solde via un dépôt direct 1:1 ou le système de parrainage.',
      steps: [
        'Ouvrez l’onglet Portefeuilles',
        'Choisissez « Débloquer » ou « Direct Deposit Unfreeze »',
        'Saisissez le montant à débloquer',
        'Envoyez le même montant au compte indiqué',
        'Téléversez la preuve du transfert',
        'Votre solde est débloqué instantanément en 1:1',
      ],
      faq: [
        { q: 'Y a-t-il des frais pour débloquer ?', a: 'Non, le déblocage est totalement gratuit.' },
        { q: 'Y a-t-il un minimum ?', a: 'Le minimum dépend du type de portefeuille.' },
      ],
    },
    de: {
      title: 'So entfrieren Sie Ihr Guthaben bei VEX Deals — vollständiger Leitfaden',
      desc: 'Schritte zum Entfrieren des Guthabens über eine 1:1-Direkteinzahlung oder das Empfehlungssystem.',
      steps: [
        'Öffnen Sie den Wallet-Tab',
        'Wählen Sie „Entfrieren" oder „Direct Deposit Unfreeze"',
        'Geben Sie den einzufrierenden Betrag ein',
        'Senden Sie denselben Betrag auf das angegebene Konto',
        'Laden Sie den Überweisungsbeleg hoch',
        'Ihr Guthaben wird sofort im Verhältnis 1:1 entfroren',
      ],
      faq: [
        { q: 'Fallen Gebühren beim Entfrieren an?', a: 'Nein, das Entfrieren ist völlig kostenlos.' },
        { q: 'Gibt es einen Mindestbetrag?', a: 'Das Minimum hängt vom Wallet-Typ ab.' },
      ],
    },
    tr: {
      title: 'VEX Deals’te Bakiyenizi Nasıl Çözersiniz — Tam Rehber',
      desc: '1:1 doğrudan para yatırma veya referans sistemiyle bakiye çözme adımları.',
      steps: [
        'Cüzdanlar sekmesini açın',
        '"Çöz" veya "Direct Deposit Unfreeze" seçin',
        'Çözmek istediğiniz tutarı girin',
        'Aynı tutarı belirtilen hesaba gönderin',
        'Transfer kanıtını yükleyin',
        'Bakiyeniz 1:1 oranında anında çözülür',
      ],
      faq: [
        { q: 'Çözme ücreti var mı?', a: 'Hayır, bakiye çözme tamamen ücretsizdir.' },
        { q: 'Alt limit var mı?', a: 'Alt limit cüzdan türüne bağlıdır.' },
      ],
    },
    pt: {
      title: 'Como desbloquear seu saldo na VEX Deals — guia completo',
      desc: 'Passos para desbloquear seu saldo via depósito direto 1:1 ou o sistema de indicações.',
      steps: [
        'Abra a aba de carteiras',
        'Escolha "Desbloquear" ou "Direct Deposit Unfreeze"',
        'Informe o valor que deseja desbloquear',
        'Envie o mesmo valor para a conta indicada',
        'Envie o comprovante da transferência',
        'Seu saldo é desbloqueado na hora, na proporção 1:1',
      ],
      faq: [
        { q: 'Há taxas para desbloquear?', a: 'Não, desbloquear é totalmente gratuito.' },
        { q: 'Existe valor mínimo?', a: 'O mínimo depende do tipo de carteira.' },
      ],
    },
  },
  'ai-predictions-guide': {
    ar: {
      title: 'كيف تقرأ توقعات المباريات بالذكاء الاصطناعي — VEX AI',
      desc: 'دليل فهم توقعات Gemini AI للمباريات: احتمالات الفوز، النتيجة المتوقعة، ومؤشر الثقة.',
      steps: [
        'افتح تبويب "AI Sports" في VEX Deals',
        'اختر المباراة المراد تحليلها',
        'اقرأ النتيجة المتوقعة واحتمالات الفوز',
        'راجع التحليل التكتيكي ونقاط القوة',
        'راقب مؤشر الثقة (Confidence Score)',
        'اتبع التوصية بمسؤولية',
      ],
      faq: [
        { q: 'ما دقة التوقعات؟', a: 'تعتمد على نموذج Gemini AI مع مؤشر ثقة لكل توقع.' },
        { q: 'هل التوقعات مجانية؟', a: 'نعم، جميع التوقعات مجانية لمستخدمي VEX Deals.' },
      ],
    },
    en: {
      title: 'How to Read AI Match Predictions — VEX AI Guide',
      desc: 'A guide to understanding Gemini AI match predictions: win probabilities, predicted scores, and confidence.',
      steps: [
        'Open the AI Sports tab',
        'Select the match you want to analyze',
        'Read the predicted score and win probabilities',
        'Review the tactical analysis and key strengths',
        'Watch the confidence score',
        'Follow the recommendation responsibly',
      ],
      faq: [
        { q: 'How accurate are the predictions?', a: 'They are powered by the Gemini AI model with a confidence score for each prediction.' },
        { q: 'Are the predictions free?', a: 'Yes, all predictions are free for platform users.' },
      ],
    },
    es: {
      title: 'Cómo leer las predicciones de partidos con IA — guía VEX AI',
      desc: 'Guía para entender las predicciones de partidos con Gemini AI: probabilidades, resultado previsto y confianza.',
      steps: [
        'Abre la pestaña de AI Sports',
        'Selecciona el partido que quieres analizar',
        'Lee el resultado previsto y las probabilidades de victoria',
        'Revisa el análisis táctico y puntos fuertes',
        'Observa el índice de confianza',
        'Sigue la recomendación con responsabilidad',
      ],
      faq: [
        { q: '¿Qué tan precisas son las predicciones?', a: 'Usan el modelo Gemini AI con un índice de confianza para cada predicción.' },
        { q: '¿Las predicciones son gratis?', a: 'Sí, todas las predicciones son gratuitas para los usuarios.' },
      ],
    },
    ru: {
      title: 'Как читать AI-прогнозы матчей — руководство VEX AI',
      desc: 'Руководство по пониманию AI-прогнозов матчей: вероятности побед, прогноз счёта и уровень уверенности.',
      steps: [
        'Откройте вкладку AI Sports',
        'Выберите матч для анализа',
        'Изучите прогноз счёта и вероятности побед',
        'Оцените тактический анализ и сильные стороны',
        'Обратите внимание на уровень уверенности',
        'Следуйте рекомендации ответственно',
      ],
      faq: [
        { q: 'Насколько точны прогнозы?', a: 'Они основаны на модели Gemini AI с уровнем уверенности для каждого прогноза.' },
        { q: 'Прогнозы бесплатные?', a: 'Да, все прогнозы бесплатны для пользователей платформы.' },
      ],
    },
    fr: {
      title: 'Comment lire les prédictions de matchs par IA — guide VEX AI',
      desc: 'Guide pour comprendre les prédictions de matchs Gemini AI : probabilités, score prévu et niveau de confiance.',
      steps: [
        'Ouvrez l’onglet AI Sports',
        'Sélectionnez le match à analyser',
        'Lisez le score prévu et les probabilités de victoire',
        'Examinez l’analyse tactique et les forces',
        'Surveillez l’indice de confiance',
        'Suivez la recommandation de manière responsable',
      ],
      faq: [
        { q: 'Quelle est la précision des prédictions ?', a: 'Elles sont générées par le modèle Gemini AI avec un indice de confiance pour chaque prédiction.' },
        { q: 'Les prédictions sont-elles gratuites ?', a: 'Oui, toutes les prédictions sont gratuites pour les utilisateurs.' },
      ],
    },
    de: {
      title: 'So lesen Sie KI-Spielprognosen — VEX AI Leitfaden',
      desc: 'Leitfaden zum Verständnis von Gemini-KI-Prognosen: Siegwahrscheinlichkeiten, TorgPrognose und Konfidenz.',
      steps: [
        'Öffnen Sie den AI-Sports-Tab',
        'Wählen Sie das zu analysierende Spiel',
        'Lesen Sie die TorgPrognose und Siegwahrscheinlichkeiten',
        'Prüfen Sie die taktische Analyse und Stärken',
        'Beachten Sie den Konfidenzwert',
        'Folgen Sie der Empfehlung verantwortungsvoll',
      ],
      faq: [
        { q: 'Wie genau sind die Prognosen?', a: 'Sie basieren auf dem Gemini-KI-Modell mit einem Konfidenzwert für jede Prognose.' },
        { q: 'Sind die Prognosen kostenlos?', a: 'Ja, alle Prognosen sind für Nutzer kostenlos.' },
      ],
    },
    tr: {
      title: 'Yapay Zeka Maç Tahminleri Nasıl Okunur — VEX AI Rehberi',
      desc: 'Gemini AI maç tahminlerini anlama rehberi: kazanma olasılıkları, skor tahmini ve güven seviyesi.',
      steps: [
        'AI Sports sekmesini açın',
        'Analiz etmek istediğiniz maçı seçin',
        'Tahmini skoru ve kazanma olasılıklarını okuyun',
        'Taktik analizi ve güçlü yönleri inceleyin',
        'Güven skorunu takip edin',
        'Öneriyi sorumlulukla uygulayın',
      ],
      faq: [
        { q: 'Tahminler ne kadar doğru?', a: 'Her tahmin için güven skoruyla Gemini AI modeli tarafından üretilirler.' },
        { q: 'Tahminler ücretsiz mi?', a: 'Evet, tüm tahminler platform kullanıcıları için ücretsizdir.' },
      ],
    },
    pt: {
      title: 'Como ler as previsões de jogos com IA — guia VEX AI',
      desc: 'Guia para entender as previsões com Gemini AI: probabilidades, placar previsto e confiança.',
      steps: [
        'Abra a aba AI Sports',
        'Selecione o jogo que deseja analisar',
        'Leia o placar previsto e as probabilidades de vitória',
        'Revise a análise tática e os pontos fortes',
        'Observe o índice de confiança',
        'Siga a recomendação com responsabilidade',
      ],
      faq: [
        { q: 'Quão precisas são as previsões?', a: 'Elas são geradas pelo modelo Gemini AI com um índice de confiança para cada previsão.' },
        { q: 'As previsões são grátis?', a: 'Sim, todas as previsões são gratuitas para os usuários.' },
      ],
    },
  },
  'provably-fair-lottery': {
    ar: {
      title: 'اليانصيب التكافلي المُثبت العدالة — كيف يعمل SHA-256',
      desc: 'شرح نظام اليانصيب القابل للتحقق في VEX Deals باستخدام تشفير SHA-256.',
      steps: [
        'اختار 5 أرقام من 1 إلى 30',
        'ادفع قيمة التذكرة عبر وسيلة الدفع المتاحة',
        'السحب يتم بعد انتهاء المدة (ساعة/يوم/أسبوع)',
        'الأرقام الفائزة تُحسب بـ SHA-256 hashing',
        'يمكنك التحقق من عدالة كل سحب',
        'اربح حتى 10,000$ في Jackpot',
      ],
      faq: [
        { q: 'هل السحب عادل؟', a: 'نعم، كل سحب مُثبت بـ SHA-256 server seed + client seed + nonce.' },
        { q: 'كم قيمة الجائزة؟', a: 'من 2.50$ حتى 10,000$+ حسب الترتيب.' },
      ],
    },
    en: {
      title: 'Provably Fair Lottery — How SHA-256 Works',
      desc: 'How the verifiable lottery system works using SHA-256 hashing.',
      steps: [
        'Pick 5 numbers from 1 to 30',
        'Pay for your ticket using an available payment method',
        'The draw happens when the timer ends (hour/day/week)',
        'Winning numbers are computed with SHA-256 hashing',
        'You can verify the fairness of every draw',
        'Win up to $10,000 in the Jackpot',
      ],
      faq: [
        { q: 'Are the draws fair?', a: 'Yes, every draw uses SHA-256 server seed + client seed + nonce.' },
        { q: 'How big are the prizes?', a: 'From $2.50 up to $10,000+ depending on the tier.' },
      ],
    },
    es: {
      title: 'Lotería demostrablemente justa — cómo funciona SHA-256',
      desc: 'Cómo funciona el sistema de lotería verificable con hashing SHA-256.',
      steps: [
        'Elige 5 números del 1 al 30',
        'Paga tu ticket con un método de pago disponible',
        'El sorteo se realiza al terminar el tiempo (hora/día/semana)',
        'Los números ganadores se calculan con hashing SHA-256',
        'Puedes verificar la justicia de cada sorteo',
        'Gana hasta 10.000 $ en el Jackpot',
      ],
      faq: [
        { q: '¿Los sorteos son justos?', a: 'Sí, cada sorteo usa SHA-256 server seed + client seed + nonce.' },
        { q: '¿Cuáles son los premios?', a: 'Desde 2,50 $ hasta más de 10.000 $ según la categoría.' },
      ],
    },
    ru: {
      title: 'Честная лотерея с доказательством — как работает SHA-256',
      desc: 'Как работает проверяемая система лотереи на хешировании SHA-256.',
      steps: [
        'Выберите 5 чисел от 1 до 30',
        'Оплатите билет доступным способом',
        'Розыгрыш проходит по таймеру (час/день/неделя)',
        'Выигрышные числа считаются хешированием SHA-256',
        'Вы можете проверить честность каждого розыгрыша',
        'Выиграйте до 10 000 $ в Джекпоте',
      ],
      faq: [
        { q: 'Розыгрыши честные?', a: 'Да, каждый розыгрыш использует SHA-256 server seed + client seed + nonce.' },
        { q: 'Каковы призы?', a: 'От 2,50 $ до 10 000 $+ в зависимости от уровня.' },
      ],
    },
    fr: {
      title: 'Loterie vérifiablement équitable — comment fonctionne SHA-256',
      desc: 'Comment fonctionne le système de loterie vérifiable avec le hachage SHA-256.',
      steps: [
        'Choisissez 5 numéros de 1 à 30',
        'Payez votre ticket avec un moyen de paiement disponible',
        'Le tirage a lieu à la fin du minuteur (heure/jour/semaine)',
        'Les numéros gagnants sont calculés par hachage SHA-256',
        'Vous pouvez vérifier l’équité de chaque tirage',
        'Gagnez jusqu’à 10 000 $ au Jackpot',
      ],
      faq: [
        { q: 'Les tirages sont-ils équitables ?', a: 'Oui, chaque tirage utilise SHA-256 server seed + client seed + nonce.' },
        { q: 'Quels sont les prix ?', a: 'De 2,50 $ à plus de 10 000 $ selon la catégorie.' },
      ],
    },
    de: {
      title: 'Nachweisbar faires Lotto — so funktioniert SHA-256',
      desc: 'So funktioniert das überprüfbare Lotto-System mit SHA-256-Hashing.',
      steps: [
        'Wählen Sie 5 Zahlen von 1 bis 30',
        'Bezahlen Sie Ihr Ticket mit einer verfügbaren Zahlungsmethode',
        'Die Ziehung erfolgt nach Ablauf des Timers (Stunde/Tag/Woche)',
        'Die Gewinnzahlen werden mit SHA-256-Hashing berechnet',
        'Sie können die Fairness jeder Ziehung überprüfen',
        'Gewinnen Sie bis zu 10.000 $ im Jackpot',
      ],
      faq: [
        { q: 'Sind die Ziehungen fair?', a: 'Ja, jede Ziehung nutzt SHA-256 server seed + client seed + nonce.' },
        { q: 'Wie hoch sind die Preise?', a: 'Von 2,50 $ bis über 10.000 $ je nach Stufe.' },
      ],
    },
    tr: {
      title: 'Kanıtlanabilir Adil Piyango — SHA-256 Nasıl Çalışır',
      desc: 'SHA-256 hashing ile doğrulanabilir piyango sisteminin çalışma şekli.',
      steps: [
        '1 ile 30 arasında 5 sayı seçin',
        'Mevcut ödeme yöntemiyle biletinizi satın alın',
        'Çekiliş süre bitiminde yapılır (saat/gün/hafta)',
        'Kazanan sayılar SHA-256 hashing ile hesaplanır',
        'Her çekilişin adaletini doğrulayabilirsiniz',
        'Jackpot’ta 10.000$’a kadar kazanın',
      ],
      faq: [
        { q: 'Çekilişler adil mi?', a: 'Evet, her çekiliş SHA-256 server seed + client seed + nonce kullanır.' },
        { q: 'Ödüller ne kadar?', a: 'Kategoriye göre 2,50$’dan 10.000$+’ya kadar.' },
      ],
    },
    pt: {
      title: 'Loteria comprovadamente justa — como funciona o SHA-256',
      desc: 'Como funciona o sistema de loteria verificável com hash SHA-256.',
      steps: [
        'Escolha 5 números de 1 a 30',
        'Pague seu bilhete com um método de pagamento disponível',
        'O sorteio ocorre ao fim do temporizador (hora/dia/semana)',
        'Os números vencedores são calculados com hash SHA-256',
        'Você pode verificar a justiça de cada sorteio',
        'Ganhe até US$ 10.000 no Jackpot',
      ],
      faq: [
        { q: 'Os sorteios são justos?', a: 'Sim, cada sorteio usa SHA-256 server seed + client seed + nonce.' },
        { q: 'Quais são os prêmios?', a: 'De US$ 2,50 até mais de US$ 10.000, conforme a categoria.' },
      ],
    },
  },
};

export const getGuide = (slug: string, lang: string): GuideLang | null => {
  const g = GUIDES[slug];
  if (!g) return null;
  return g[lang] || g['en'] || g['ar'];
};
