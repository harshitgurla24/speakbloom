"""
text_generator.py
-----------------
Generates practice paragraphs for each supported language and length.

If a Groq API key is configured (GROQ_API_KEY env var), the text is
generated using the Groq LLM API (llama3-8b-8192 model, very fast & free).
Otherwise a set of hardcoded placeholder paragraphs is returned so the
project runs without any API key.
"""

import os
import random

# ---------------------------------------------------------------------------
# Placeholder paragraphs (no API key required)
# ---------------------------------------------------------------------------

PLACEHOLDER_TEXTS: dict[str, dict[str, list[str]]] = {
    "en-US": {
        "short": [
            (
                "The sun rises every morning and brings light to the world. "
                "Birds sing beautifully in the trees. "
                "Children play happily in the park and enjoy the fresh air. "
                "Nature is truly wonderful and full of life."
            ),
            (
                "Learning a new language opens many doors in life. "
                "It helps you connect with people from different cultures. "
                "Practice every day and you will improve quickly. "
                "Be patient and enjoy the journey of learning."
            ),
        ],
        "medium": [
            (
                "Technology has changed the way we live and work in remarkable ways. "
                "We can now communicate instantly with people across the globe. "
                "Mobile phones, computers, and the internet have made information "
                "available at our fingertips. Artificial intelligence is transforming "
                "industries such as healthcare, education, and transportation. "
                "However, we must use technology responsibly and ethically. "
                "It is important to balance screen time with outdoor activities "
                "and face-to-face interactions. The future belongs to those who "
                "embrace change while staying grounded in human values."
            ),
        ],
        "long": [
            (
                "The history of the English language is a fascinating journey that "
                "spans over a thousand years. English began as a Germanic dialect "
                "brought to Britain by Anglo-Saxon settlers in the fifth century. "
                "Over the centuries it absorbed words from Latin, French, Norse, "
                "and many other languages, making it one of the richest vocabularies "
                "in the world. The invention of the printing press in the fifteenth "
                "century helped standardise spelling and grammar. Shakespeare greatly "
                "expanded the language by coining thousands of new words and phrases "
                "that we still use today. The Industrial Revolution introduced "
                "technical vocabulary, and the digital age has added yet another "
                "layer of new terms. Today English is spoken by more than one and a "
                "half billion people worldwide, making it the most widely learned "
                "second language on the planet. Despite its complexity, learners "
                "around the world study English because it offers access to "
                "education, business, science, and popular culture on an "
                "international scale."
            ),
        ],
    },
    "hi-IN": {
        "short": [
            (
                "भारत एक विविधताओं से भरा देश है। "
                "यहाँ अनेक भाषाएँ, धर्म और संस्कृतियाँ मिलकर एक सुंदर समाज बनाती हैं। "
                "हमें अपनी मातृभाषा का सम्मान करना चाहिए। "
                "प्रतिदिन अभ्यास से भाषा में निपुणता आती है।"
            ),
        ],
        "medium": [
            (
                "शिक्षा हर इंसान का मौलिक अधिकार है। "
                "एक अच्छी शिक्षा व्यक्ति को सोचने, समझने और निर्णय लेने की शक्ति देती है। "
                "आज के युग में तकनीक ने शिक्षा को और भी सुलभ बना दिया है। "
                "ऑनलाइन कक्षाएँ, डिजिटल पुस्तकें और वीडियो ट्यूटोरियल ने "
                "ज्ञान के द्वार सभी के लिए खोल दिए हैं। "
                "हमें इस अवसर का लाभ उठाकर अपने जीवन को बेहतर बनाना चाहिए।"
            ),
        ],
        "long": [
            (
                "हिंदी भाषा का इतिहास बहुत समृद्ध और प्राचीन है। "
                "यह भाषा संस्कृत से विकसित हुई है और इसमें अनेक क्षेत्रीय बोलियाँ शामिल हैं। "
                "हिंदी साहित्य में कबीर, तुलसीदास, मीराबाई और रहीम जैसे महान कवियों का "
                "महत्वपूर्ण योगदान रहा है। आधुनिक हिंदी साहित्य में प्रेमचंद, "
                "महादेवी वर्मा और हरिवंश राय बच्चन ने नई ऊँचाइयाँ स्थापित की हैं। "
                "हिंदी भारत की राजभाषा है और देश के अधिकांश हिस्सों में बोली जाती है। "
                "विश्व में लगभग साठ करोड़ से अधिक लोग हिंदी बोलते और समझते हैं। "
                "इसे सरल, स्पष्ट और प्रभावशाली भाषा माना जाता है। "
                "हमें गर्व होना चाहिए कि हम इतनी समृद्ध भाषा के वक्ता हैं।"
            ),
        ],
    },
    "mr-IN": {
        "short": [
            (
                "महाराष्ट्र हे एक सुंदर राज्य आहे. "
                "येथे अनेक ऐतिहासिक किल्ले आणि मंदिरे आहेत. "
                "मराठी भाषा अत्यंत समृद्ध आणि गोड आहे. "
                "आपण दररोज अभ्यास केल्यास भाषेवर प्रभुत्व मिळवता येते."
            ),
        ],
        "medium": [
            (
                "शिक्षण हे समाजाच्या प्रगतीचे मूळ आहे. "
                "एक सुशिक्षित व्यक्ती स्वतःसाठी आणि समाजासाठी योगदान देऊ शकतो. "
                "आजच्या डिजिटल युगात तंत्रज्ञानाने शिक्षणाला नवी दिशा दिली आहे. "
                "ऑनलाइन शिक्षणामुळे दूरस्थ भागातील विद्यार्थीही दर्जेदार शिक्षण घेऊ शकतात. "
                "आपण या संधीचा पुरेपूर उपयोग करावा."
            ),
        ],
        "long": [
            (
                "मराठी भाषेचा इतिहास अत्यंत प्राचीन आहे. "
                "संत ज्ञानेश्वर, संत तुकाराम, संत एकनाथ यांनी मराठी साहित्यात "
                "अमूल्य योगदान दिले आहे. छत्रपती शिवाजी महाराजांनी राज्यव्यवहारात "
                "मराठी भाषेला सन्मानाचे स्थान दिले. आधुनिक काळात विष्णुशास्त्री चिपळूणकर, "
                "लोकमान्य टिळक आणि आगरकर यांनी मराठी पत्रकारिता आणि साहित्याला "
                "नवी उंची दिली. मराठी भाषा महाराष्ट्राची अधिकृत भाषा आहे आणि "
                "जगभरात सुमारे नव्वद लाखांहून अधिक लोक मराठी बोलतात. "
                "आपल्या मातृभाषेचे संवर्धन करणे हे आपले कर्तव्य आहे."
            ),
        ],
    },
    "gu-IN": {
        "short": [
            (
                "ગુજરાત એ ભારતનું એક સુંદર રાજ્ય છે. "
                "અહીં ઘણી ઐતિહાસિક ઇમારતો અને સ્થળો આવેલા છે. "
                "ગુજરાતી ભાષા ખૂબ જ મીઠી અને સરળ છે. "
                "દરરોજ અભ્યાસ કરવાથી ભાષા પર પ્રભુત્વ મળે છે."
            ),
        ],
        "medium": [
            (
                "શિક્ષણ એ દરેક વ્યક્તિનો મૂળભૂત અધિકાર છે. "
                "સારા શિક્ષણ દ્વારા આપણે જીવનમાં સફળ થઈ શકીએ છીએ. "
                "ટેક્નોલોજીએ શિક્ષણને વધુ સુલભ અને અસરકારક બનાવ્યું છે. "
                "ઓનલાઇન અભ્યાસ દ્વારા ઘેર બેઠા જ ઉત્તમ શિક્ષણ મળી શકે છે. "
                "આ તકનો ભરપૂર ઉપયોગ કરી આગળ વધવું જોઈએ."
            ),
        ],
        "long": [
            (
                "ગુજરાતી ભાષાનો ઈતિહાસ ખૂબ જ સમૃદ્ધ છે. "
                "નરસિંહ મહેતા, મીરાં, અખો અને દયારામ જેવા મહાન સંત-કવિઓએ "
                "ગુજરાતી સાહિત્યને અનોખી ઊંચાઈ પ્રદાન કરી છે. "
                "ગાંધીજી અને સરદાર પટેલ ગુજરાતની ગૌરવશાળી વ્યક્તિઓ છે. "
                "ગુજરાત ઉદ્યોગ, વ્યાપાર અને સૌ-સૌ ક્ષેત્રે ઝડપથી પ્રગતિ કરી રહ્યું છે. "
                "ગુજરાતી ભાષા ભારત ઉપરાંત વિશ્વના અનેક દેશોમાં બોલાય છે. "
                "આ ભાષાની ખૂબ સુંદર સ્ક્રિપ્ટ અને ઉચ્ચારણ-વ્યવસ્થા છે. "
                "આપણે ગર્વ સાથે આ ભાષા શીખીએ અને બોલીએ."
            ),
        ],
    },
    "bn-IN": {
        "short": [
            (
                "বাংলা একটি সুন্দর ভাষা। "
                "এই ভাষায় রবীন্দ্রনাথ ঠাকুর সাহিত্য রচনা করেছেন। "
                "প্রতিদিন অনুশীলন করলে ভাষায় দক্ষতা আসে। "
                "আমাদের মাতৃভাষার প্রতি শ্রদ্ধাশীল হওয়া উচিত।"
            ),
        ],
        "medium": [
            (
                "শিক্ষা মানুষের জীবনের সবচেয়ে মূল্যবান সম্পদ। "
                "ভালো শিক্ষা মানুষকে সঠিক পথে পরিচালিত করে। "
                "আধুনিক প্রযুক্তি শিক্ষাকে আরও সহজলভ্য করে তুলেছে। "
                "অনলাইন শিক্ষার মাধ্যমে ঘরে বসেই বিশ্বমানের জ্ঞান অর্জন করা সম্ভব। "
                "আমাদের এই সুযোগকে সঠিকভাবে কাজে লাগানো উচিত।"
            ),
        ],
        "long": [
            (
                "বাংলা ভাষার ইতিহাস অত্যন্ত সমৃদ্ধ এবং গৌরবময়। "
                "রবীন্দ্রনাথ ঠাকুর বাংলা সাহিত্যকে বিশ্বদরবারে পরিচিত করেছেন। "
                "কাজী নজরুল ইসলাম বাংলা কবিতায় বিদ্রোহের সুর এনেছিলেন। "
                "১৯৫২ সালের ভাষা আন্দোলন বাংলার ইতিহাসে একটি অবিস্মরণীয় অধ্যায়। "
                "বাংলাদেশ এবং ভারতের পশ্চিমবঙ্গে বাংলা ভাষা প্রধান ভাষা হিসেবে ব্যবহৃত হয়। "
                "বিশ্বজুড়ে প্রায় ত্রিশ কোটিরও বেশি মানুষ বাংলায় কথা বলেন। "
                "এই ভাষার সুরেলা উচ্চারণ এবং সমৃদ্ধ সাহিত্য আমাদের গর্বিত করে।"
            ),
        ],
    },
    "ar-SA": {
        "short": [
            (
                "اللغة العربية لغة جميلة وغنية بالمفردات. "
                "أقرأ هذه الجمل ببطء ووضوح لتحسين النطق. "
                "الممارسة اليومية تجعل القراءة أسهل وأكثر ثقة. "
                "الالتزام بالتدريب يساعدك على التقدم بسرعة."
            ),
        ],
        "medium": [
            (
                "التعليم الجيد يفتح للإنسان أبوابا كثيرة في الحياة. "
                "من خلال القراءة والتدريب المستمر يستطيع الطالب تطوير لغته ومهاراته. "
                "تساعدنا التقنية الحديثة على الوصول إلى المعرفة بسهولة من أي مكان. "
                "لكن النجاح الحقيقي يحتاج إلى صبر وانضباط ومراجعة منتظمة. "
                "عندما نمارس اللغة كل يوم يصبح التعبير أكثر سلاسة ووضوحا."
            ),
        ],
        "long": [
            (
                "تاريخ اللغة العربية طويل ومليء بالإنجازات الأدبية والعلمية. "
                "فقد كانت العربية لغة الشعر والبلاغة ووسيلة لنقل المعارف في مجالات متعددة. "
                "كتب العلماء بها في الطب والفلك والرياضيات والفلسفة، وانتقلت هذه العلوم إلى مناطق كثيرة من العالم. "
                "كما حافظت العربية على مكانتها بفضل القرآن الكريم وما تركه الأدباء من تراث عظيم. "
                "وفي العصر الحديث ما زالت العربية حاضرة في الإعلام والتعليم والثقافة، مع حاجة مستمرة إلى تطوير مهارات القراءة والنطق والتعبير. "
                "إن تعلم العربية بإتقان يمنح المتعلم قدرة أوسع على فهم النصوص والتواصل بثقة واحترام لجمال هذه اللغة."
            ),
        ],
    },
    "te-IN": {
        "short": [
            (
                "తెలుగు ఒక మధురమైన భాష. "
                "ప్రతిరోజు కొద్దిసేపు చదవడం వల్ల ఉచ్చారణ మెరుగవుతుంది. "
                "స్పష్టంగా మాట్లాడితే ఆత్మవిశ్వాసం పెరుగుతుంది. "
                "నిరంతర సాధన విజయానికి దారి చూపుతుంది."
            ),
        ],
        "medium": [
            (
                "విద్య మన జీవితాన్ని మారుస్తుంది మరియు మంచి ఆలోచనలను ఇస్తుంది. "
                "ఈ రోజుల్లో సాంకేతికత వల్ల నేర్చుకోవడం మరింత సులభమైంది. "
                "ఆన్‌లైన్ తరగతులు, డిజిటల్ పుస్తకాలు మరియు వీడియో పాఠాలు అందరికీ ఉపయోగపడుతున్నాయి. "
                "ప్రతిరోజూ క్రమంగా చదవడం వల్ల జ్ఞానం పెరుగుతుంది మరియు భాషపై పట్టుదల వస్తుంది. "
                "సహనం, సాధన, ఆసక్తి ఉంటే ఎవరైనా మంచి ప్రగతి సాధించగలరు."
            ),
        ],
        "long": [
            (
                "తెలుగు భాషకు గొప్ప చరిత్ర మరియు సమృద్ధమైన సాహిత్య సంపద ఉంది. "
                "నన్నయ, తిక్కన, ఎర్రప్రగడ వంటి మహాకవులు తెలుగు సాహిత్యానికి అమూల్యమైన సేవలు అందించారు. "
                "భక్తి, జ్ఞానం, నైతిక విలువలు, సామాజిక సందేశాలు అన్నీ తెలుగు రచనల్లో ప్రతిఫలిస్తాయి. "
                "ఆధునిక కాలంలో కూడా తెలుగు భాష సినిమా, మీడియా, విద్యా రంగాల్లో బలంగా నిలిచింది. "
                "తెలుగు మాట్లాడేటప్పుడు సరైన ఉచ్చారణ, విరామం, మరియు స్వర స్పష్టత చాలా ముఖ్యం. "
                "నిత్య సాధనతో చదవడం, వినడం, మాట్లాడడం కొనసాగిస్తే భాషపై మంచి పట్టు ఏర్పడుతుంది."
            ),
        ],
    },
    "or-IN": {
        "short": [
            (
                "ଓଡ଼ିଆ ଏକ ସୁନ୍ଦର ଓ ସ୍ୱରମଧୁର ଭାଷା। "
                "ପ୍ରତିଦିନ ଅଭ୍ୟାସ କଲେ ଉଚ୍ଚାରଣ ଭଲ ହୁଏ। "
                "ଧୀରେ ଏବଂ ସ୍ପଷ୍ଟଭାବେ ପଢ଼ିଲେ ଆତ୍ମବିଶ୍ୱାସ ବଢ଼େ। "
                "ନିୟମିତ ପ୍ରୟାସ ଆମକୁ ଦକ୍ଷ କରେ।"
            ),
        ],
        "medium": [
            (
                "ଶିକ୍ଷା ମନୁଷ୍ୟଙ୍କ ଜୀବନକୁ ଉନ୍ନତ କରେ ଏବଂ ଭଲ ଚିନ୍ତାଧାରା ଦିଏ। "
                "ଆଜିର ଯୁଗରେ ପ୍ରଯୁକ୍ତି ଦ୍ୱାରା ଶିଖିବା ଅଧିକ ସହଜ ହୋଇଯାଇଛି। "
                "ଅନଲାଇନ୍ ଶ୍ରେଣୀ, ଡିଜିଟାଲ୍ ପୁସ୍ତକ ଏବଂ ଭିଡିଓ ପାଠ ସମସ୍ତଙ୍କ ପାଇଁ ଉପକାରୀ। "
                "ଦିନକୁ ଥୋଡ଼ା ସମୟ ନିୟମିତ ଅଭ୍ୟାସ କଲେ ଭାଷାରେ ଦକ୍ଷତା ବଢ଼େ। "
                "ଧୈର୍ଯ୍ୟ ଓ ଶୃଙ୍ଖଳା ସଫଳତାର ମୁଖ୍ୟ ଆଧାର।"
            ),
        ],
        "long": [
            (
                "ଓଡ଼ିଆ ଭାଷାର ଐତିହ୍ୟ ଅତ୍ୟନ୍ତ ଗୌରବମୟ ଏବଂ ସମୃଦ୍ଧ। "
                "ସାରଳା ଦାସ, ଉପେନ୍ଦ୍ର ଭଞ୍ଜ, ଫକିରମୋହନ ସେନାପତି ପରି ସ୍ରଷ୍ଟାମାନେ ଏହି ଭାଷାକୁ ନୂଆ ଉଚ୍ଚତା ଦେଇଛନ୍ତି। "
                "ଓଡ଼ିଆ ସାହିତ୍ୟରେ ଭକ୍ତି, ଲୋକଜୀବନ, ନୈତିକତା ଏବଂ ସମାଜ ଚିନ୍ତନର ଗଭୀର ପ୍ରତିଫଳନ ଦେଖାଯାଏ। "
                "ଆଧୁନିକ ସମୟରେ ଓଡ଼ିଆ ଭାଷା ଶିକ୍ଷା, ସାମ୍ବାଦିକତା ଓ ସାହିତ୍ୟରେ ନିଜ ଅସ୍ତିତ୍ୱକୁ ଦୃଢ଼ କରିରହିଛି। "
                "ସଠିକ ଉଚ୍ଚାରଣ ପାଇଁ ଧୀରେ ପଢ଼ିବା, ଭଲଭାବରେ ଶୁଣିବା ଏବଂ ନିୟମିତ ଅଭ୍ୟାସ ଅତ୍ୟାବଶ୍ୟକ। "
                "ଏହି ଭାଷାର ମାଧୁର୍ୟ ଓ ସମୃଦ୍ଧି ଆମ ପାଇଁ ଗର୍ବର ବିଷୟ।"
            ),
        ],
    },
    "ta-IN": {
        "short": [
            (
                "தமிழ் ஒரு இனிமையான மொழி. "
                "தினமும் சிறிது நேரம் வாசித்தால் உச்சரிப்பு மேம்படும். "
                "தெளிவாக பேசுவதால் நம்பிக்கை அதிகரிக்கும். "
                "தொடர்ந்த பயிற்சி நல்ல முன்னேற்றத்தை தரும்."
            ),
        ],
        "medium": [
            (
                "கல்வி மனித வாழ்க்கையை மேம்படுத்தும் முக்கியமான சக்தியாகும். "
                "இன்றைய காலத்தில் தொழில்நுட்பம் கற்றலை மிகவும் எளிதாக்கியுள்ளது. "
                "ஆன்லைன் வகுப்புகள், மின்னணு புத்தகங்கள் மற்றும் காணொலி பாடங்கள் பலருக்கும் உதவுகின்றன. "
                "தினமும் ஒழுங்காகப் பயிற்சி செய்தால் மொழித் திறனும் நம்பிக்கையும் வளர்கின்றன. "
                "அமைதி, ஆர்வம், முயற்சி ஆகியவை வெற்றிக்கான அடிப்படை."
            ),
        ],
        "long": [
            (
                "தமிழ் உலகின் பழமையான மற்றும் செம்மையான மொழிகளில் ஒன்றாக மதிக்கப்படுகிறது. "
                "சங்க இலக்கியம் தொடங்கி நவீன எழுத்துகள் வரை தமிழுக்கு மிகுந்த இலக்கிய செல்வம் உள்ளது. "
                "திருவள்ளுவர், கம்பர், பாரதியார் போன்ற சிறந்த படைப்பாளர்கள் தமிழின் அழகையும் ஆழத்தையும் உலகிற்கு அறிமுகப்படுத்தினர். "
                "இன்றைய காலத்திலும் தமிழ் கல்வி, ஊடகம், அறிவியல் மற்றும் கலைத் துறைகளில் தன்னுடைய வலிமையை காட்டுகிறது. "
                "சரியான உச்சரிப்புடன் தமிழ் வாசிப்பதற்கு ஒவ்வொரு சொல்லின் ஒலி மற்றும் இடைவெளியை கவனிக்க வேண்டும். "
                "நேர்த்தியான பயிற்சி மூலம் தமிழ் பேசும் திறன் தெளிவாகவும் அழகாகவும் வளர்கிறது."
            ),
        ],
    },
    "pa-IN": {
        "short": [
            (
                "ਪੰਜਾਬੀ ਇੱਕ ਮਿੱਠੀ ਅਤੇ ਜੋਸ਼ ਭਰੀ ਭਾਸ਼ਾ ਹੈ। "
                "ਰੋਜ਼ ਥੋੜ੍ਹਾ ਪੜ੍ਹਨ ਨਾਲ ਉਚਾਰਣ ਸੁਧਰਦਾ ਹੈ। "
                "ਸਾਫ਼ ਬੋਲਣ ਨਾਲ ਵਿਸ਼ਵਾਸ ਵੱਧਦਾ ਹੈ। "
                "ਨਿਯਮਿਤ ਅਭਿਆਸ ਨਾਲ ਭਾਸ਼ਾ ਤੇ ਪਕੜ ਮਜ਼ਬੂਤ ਹੁੰਦੀ ਹੈ।"
            ),
        ],
        "medium": [
            (
                "ਸਿੱਖਿਆ ਮਨੁੱਖ ਦੇ ਜੀਵਨ ਨੂੰ ਨਵੀਂ ਦਿਸ਼ਾ ਦਿੰਦੀ ਹੈ ਅਤੇ ਸੋਚ ਨੂੰ ਵਧਾਉਂਦੀ ਹੈ। "
                "ਅੱਜਕੱਲ੍ਹ ਤਕਨਾਲੋਜੀ ਦੀ ਮਦਦ ਨਾਲ ਸਿੱਖਣਾ ਕਾਫ਼ੀ ਆਸਾਨ ਹੋ ਗਿਆ ਹੈ। "
                "ਆਨਲਾਈਨ ਕਲਾਸਾਂ, ਡਿਜ਼ਿਟਲ ਕਿਤਾਬਾਂ ਅਤੇ ਵੀਡੀਓ ਪਾਠ ਹਰ ਵਿਦਿਆਰਥੀ ਲਈ ਲਾਭਕਾਰੀ ਹਨ। "
                "ਜੇ ਅਸੀਂ ਹਰ ਰੋਜ਼ ਧਿਆਨ ਨਾਲ ਅਭਿਆਸ ਕਰੀਏ ਤਾਂ ਭਾਸ਼ਾ ਵਿੱਚ ਸਫ਼ਾਈ ਆ ਜਾਂਦੀ ਹੈ। "
                "ਧੀਰਜ ਅਤੇ ਲਗਨ ਨਾਲ ਹਰ ਕੋਈ ਅੱਗੇ ਵੱਧ ਸਕਦਾ ਹੈ।"
            ),
        ],
        "long": [
            (
                "ਪੰਜਾਬੀ ਭਾਸ਼ਾ ਦਾ ਇਤਿਹਾਸ ਬਹੁਤ ਧਨਾਢ ਅਤੇ ਜੀਵੰਤ ਹੈ। "
                "ਗੁਰੂ ਸਾਹਿਬਾਨ, ਸੂਫ਼ੀ ਕਵੀ ਅਤੇ ਲੋਕ ਗਾਇਕਾਂ ਨੇ ਇਸ ਭਾਸ਼ਾ ਨੂੰ ਆਤਮਿਕਤਾ ਅਤੇ ਲੋਕਧਾਰਾ ਨਾਲ ਜੋੜਿਆ ਹੈ। "
                "ਗੁਰਮੁਖੀ ਲਿਪੀ ਨੇ ਪੰਜਾਬੀ ਨੂੰ ਵੱਖਰੀ ਪਹਚਾਣ ਦਿੱਤੀ ਅਤੇ ਸਾਹਿਤਕ ਵਿਕਾਸ ਵਿੱਚ ਮਹੱਤਵਪੂਰਨ ਭੂਮਿਕਾ ਨਿਭਾਈ। "
                "ਅੱਜ ਪੰਜਾਬੀ ਭਾਸ਼ਾ ਸੰਗੀਤ, ਸਿਨੇਮਾ, ਮੀਡੀਆ ਅਤੇ ਵਿਸ਼ਵ ਭਰ ਦੇ ਪੰਜਾਬੀ ਸਮੂਹਾਂ ਰਾਹੀਂ ਕਾਫ਼ੀ ਫੈਲ ਰਹੀ ਹੈ। "
                "ਠੀਕ ਉਚਾਰਣ ਲਈ ਸ਼ਬਦਾਂ ਦੀ ਧੁਨੀ, ਲਹਿਜ਼ਾ ਅਤੇ ਰੁਕਾਵਟਾਂ ਦਾ ਧਿਆਨ ਰੱਖਣਾ ਜਰੂਰੀ ਹੈ। "
                "ਰੋਜ਼ਾਨਾ ਪੜ੍ਹਨ, ਸੁਣਨ ਅਤੇ ਬੋਲਣ ਨਾਲ ਪੰਜਾਬੀ ਹੋਰ ਸੁਚੱਜੀ ਅਤੇ ਪ੍ਰਭਾਵਸ਼ਾਲੀ ਬਣਦੀ ਹੈ।"
            ),
        ],
    },
    "sa-IN": {
        "short": [
            (
                "संस्कृतं प्राचीनं समृद्धं च भाषारत्नम् अस्ति। "
                "प्रतिदिनं स्वल्पं पठनेन उच्चारणं सुधरति। "
                "स्पष्टवाचनम् आत्मविश्वासं वर्धयति। "
                "नियमिताभ्यासः प्रगतेः मूलम् अस्ति।"
            ),
        ],
        "medium": [
            (
                "विद्या मनुष्यस्य जीवनं प्रकाशयति तथा उत्तमविचारान् ददाति। "
                "अद्यतनकाले तन्त्रज्ञानस्य साहाय्येन अध्ययनं सुलभतरं जातम्। "
                "जालपाठाः, डिजिटलपुस्तकानि, चित्रपाठाश्च सर्वेषां विद्यार्थिनां हिताय भवन्ति। "
                "यदि वयं प्रतिदिनं नियमितरूपेण अभ्यासं कुर्मः, तर्हि भाषायां निपुणता वर्धते। "
                "धैर्यं, श्रमः, रुचिश्च सफलतायाः प्रमुखकारणानि सन्ति।"
            ),
        ],
        "long": [
            (
                "संस्कृतभाषा भारतीयसंस्कृतेः अमूल्यं धरोहररूपं स्थानं धारयति। "
                "वेदाः, उपनिषदः, महाकाव्यानि, नाट्यग्रन्थाश्च अस्याः भाषायाः गौरवं विस्तरयन्ति। "
                "पाणिनिनः व्याकरणं विश्वे अतीव सूक्ष्मं वैज्ञानिकं च मन्यते। "
                "संस्कृतस्य अध्ययनं केवलं भाषाज्ञानं न ददाति, अपितु विचारशुद्धिं, तर्कशक्तिं, सांस्कृतिकबोधं च वर्धयति। "
                "शुद्धोच्चारणाय वर्णानां स्वराणां च यथोचितं अभ्यासः आवश्यकः। "
                "नियमितपठनश्रवणवक्तृत्वाभ्यासेन संस्कृतभाषायां प्रवीणता शनैः शनैः विकसितुं शक्यते।"
            ),
        ],
    },
    "ml-IN": {
        "short": [
            (
                "മലയാളം മനോഹരവും സമ്പന്നവുമായ ഭാഷയാണ്. "
                "പ്രതിദിനം കുറച്ച് വായിച്ചാൽ ഉച്ചാരണം മെച്ചപ്പെടുന്നു. "
                "തെളിവായി സംസാരിക്കുന്നത് ആത്മവിശ്വാസം വർധിപ്പിക്കുന്നു. "
                "നിയമിതമായ അഭ്യാസം നല്ല പുരോഗതി നൽകുന്നു."
            ),
        ],
        "medium": [
            (
                "വിദ്യാഭ്യാസം മനുഷ്യന്റെ ജീവിതത്തെ മെച്ചപ്പെടുത്തുന്ന പ്രധാന ശക്തിയാണ്. "
                "ഇന്നത്തെ കാലത്ത് സാങ്കേതിക വിദ്യ പഠനത്തെ വളരെ എളുപ്പമാക്കിയിരിക്കുന്നു. "
                "ഓൺലൈൻ ക്ലാസുകൾ, ഡിജിറ്റൽ പുസ്തകങ്ങൾ, വീഡിയോ പാഠങ്ങൾ എന്നിവ പഠനത്തിന് വലിയ സഹായമാണ്. "
                "പ്രതിദിനം സ്ഥിരമായി പരിശീലനം നടത്തിയാൽ ഭാഷാപരിചയം കൂടുതൽ വ്യക്തമായി വളരും. "
                "ക്ഷമയും താത്പര്യവും പരിശ്രമവും വിജയത്തിലേക്കുള്ള വഴിയാണ്."
            ),
        ],
        "long": [
            (
                "മലയാളഭാഷയ്ക്ക് സമ്പന്നമായ സാഹിത്യ പാരമ്പര്യവും ശ്രദ്ധേയമായ ചരിത്രവുമുണ്ട്. "
                "എഴുത്തച്ഛൻ മുതൽ ആധുനിക സാഹിത്യകാരന്മാർ വരെ മലയാളഭാഷയുടെ വളർച്ചയിൽ വലിയ പങ്കുവഹിച്ചു. "
                "കവിത, കഥ, നാടകം, ലേഖനം എന്നീ മേഖലകളിൽ മലയാളം ശക്തമായ സാന്നിധ്യം പുലർത്തുന്നു. "
                "ഇന്നും മലയാളം വിദ്യാഭ്യാസം, മാധ്യമം, സിനിമ, സംസ്കാരം എന്നിവയിൽ സജീവമായി ഉപയോഗിക്കപ്പെടുന്നു. "
                "ശുദ്ധമായ ഉച്ചാരണത്തിന് ഓരോ പദത്തിന്റെയും ശബ്ദവും ഇടവേളയും ശ്രദ്ധിക്കുന്നത് പ്രധാനമാണ്. "
                "ദിവസേന വായിക്കുകയും കേൾക്കുകയും സംസാരിക്കുകയും ചെയ്താൽ മലയാളത്തിൽ ആത്മവിശ്വാസത്തോടെ ആശയവിനിമയം നടത്താൻ കഴിയും."
            ),
        ],
    },
}

LENGTH_MAP = {
    "short": "short",
    "medium": "medium",
    "long": "long",
}


def _pick_placeholder(language: str, length: str) -> str:
    """Return a random placeholder paragraph for the given language/length."""
    lang_data = PLACEHOLDER_TEXTS.get(language, PLACEHOLDER_TEXTS["en-US"])
    length_key = LENGTH_MAP.get(length, "medium")
    options = lang_data.get(length_key) or lang_data.get("medium") or []
    if not options:
        # fallback to English
        options = PLACEHOLDER_TEXTS["en-US"]["medium"]
    return random.choice(options)


# ---------------------------------------------------------------------------
# Groq-based generation
# ---------------------------------------------------------------------------

LANGUAGE_NAMES = {
    "en-US": "English",
    "hi-IN": "Hindi",
    "mr-IN": "Marathi",
    "gu-IN": "Gujarati",
    "bn-IN": "Bengali",
    "ar-SA": "Arabic",
    "te-IN": "Telugu",
    "or-IN": "Odia",
    "ta-IN": "Tamil",
    "pa-IN": "Punjabi",
    "sa-IN": "Sanskrit",
    "ml-IN": "Malayalam",
}

WORD_COUNTS = {
    "short": "40 to 60 words",
    "medium": "80 to 120 words",
    "long": "150 to 180 words",
}

# How each difficulty level changes the AI prompt
LEVEL_INSTRUCTIONS = {
    "easy": (
        "Use very simple, common everyday words. "
        "Keep sentences short and clear. "
        "Avoid any difficult or uncommon vocabulary. "
        "Suitable for absolute beginners."
    ),
    "medium": (
        "Use moderate vocabulary with a mix of simple and slightly advanced words. "
        "Sentences can be of normal length. "
        "Suitable for intermediate learners."
    ),
    "hard": (
        "Use complex, advanced, and less common vocabulary. "
        "Include longer sentences with varied structure. "
        "You may include alliteration, tongue-twister-like phrases, or words with "
        "challenging pronunciation. Suitable for advanced learners."
    ),
}


def _generate_with_groq(language: str, length: str, level: str = "medium", api_key: str = None) -> str:
    """Use the Groq API to generate a practice paragraph based on language, length, and level.
    
    Requires api_key to be provided - no fallback to environment variable.
    """
    try:
        from groq import Groq  # type: ignore

        # User must provide API key
        if not api_key:
            raise ValueError("Groq API key is required. Please add your API key in your profile.")
        
        # Trim the API key in case there are any spaces
        api_key = api_key.strip()
        
        # Debug logging
        print(f"[text_generator] Using Groq API with key length: {len(api_key)} chars")
        
        client = Groq(api_key=api_key)
        lang_name = LANGUAGE_NAMES.get(language, language)
        word_count = WORD_COUNTS.get(length, "80 to 120 words")
        level_instruction = LEVEL_INSTRUCTIONS.get(level, LEVEL_INSTRUCTIONS["medium"])

        prompt = (
            f"Write a natural, conversational paragraph in {lang_name} "
            f"suitable for pronunciation practice. "
            f"The paragraph should be between {word_count} long. "
            f"{level_instruction} "
            "Return ONLY the paragraph text, no extra explanation."
        )

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
            temperature=0.8,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:  # noqa: BLE001
        print(f"[text_generator] Groq call failed ({exc})")
        raise


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def generate_text(language: str, length: str, level: str = "medium", api_key: str = None) -> str:
    """
    Generate a practice paragraph.

    REQUIRES user's API key - will fail if no API key is provided.
    Users must add their Groq API key from https://console.groq.com/keys
    
    Args:
        language: BCP-47 language code
        length: 'short', 'medium', or 'long'
        level: 'easy', 'medium', or 'hard'
        api_key: Groq API key (REQUIRED)
    
    Raises:
        ValueError: If api_key is not provided
    """
    if not api_key:
        raise ValueError(
            "API key is required. Please add your Groq API key from https://console.groq.com/keys"
        )
    
    return _generate_with_groq(language, length, level, api_key)
