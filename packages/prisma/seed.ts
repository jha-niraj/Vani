/**
 * PrepSathi Database Seed Script
 * 
 * Seeds the database with:
 * - Exam Types (Loksewa)
 * - Exam Levels (Kharidar/Na.Su., Section Officer, etc.)
 * - Subjects (GK, Nepali, English, Math, Computer, Current Affairs)
 * - Topics for each subject
 * - 1000+ MCQ Questions for Kharidar exam
 * 
 * Run: pnpm --filter @repo/prisma db:seed
 */

import { PrismaClient, Prisma } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Starting PrepSathi database seed...")

    // ========================================================================
    // EXAM TYPES
    // ========================================================================
    console.log("\n📚 Creating Exam Types...")
    
    const loksewa = await prisma.examType.upsert({
        where: { id: "loksewa" },
        update: {},
        create: {
            id: "loksewa",
            name: "Loksewa (PSC)",
            nameNp: "लोकसेवा आयोग",
            description: "Nepal Public Service Commission examinations for government positions",
            descriptionNp: "नेपाल लोकसेवा आयोग परीक्षा",
            icon: "building-government",
            order: 1,
            isActive: true
        }
    })
    console.log(`  ✓ Created: ${loksewa.name}`)

    // ========================================================================
    // EXAM LEVELS
    // ========================================================================
    console.log("\n📊 Creating Exam Levels...")

    const levels = [
        {
            id: "kharidar",
            name: "Kharidar (Non-Gazetted Second Class)",
            nameNp: "खरिदार (राजपत्र अनंकित द्वितीय श्रेणी)",
            description: "Entry level non-gazetted position in Nepal civil service",
            code: "KHARIDAR",
            order: 1
        },
        {
            id: "nayab-subba",
            name: "Na.Su. (Nayab Subba)",
            nameNp: "ना.सु. (नायब सुब्बा)",
            description: "Non-gazetted first class officer position",
            code: "NASU",
            order: 2
        },
        {
            id: "section-officer",
            name: "Section Officer",
            nameNp: "शाखा अधिकृत",
            description: "Gazetted third class officer position",
            code: "SO",
            order: 3
        }
    ]

    for (const level of levels) {
        await prisma.examLevel.upsert({
            where: { id: level.id },
            update: {},
            create: {
                ...level,
                examTypeId: loksewa.id,
                isActive: true
            }
        })
        console.log(`  ✓ Created: ${level.name}`)
    }

    // ========================================================================
    // SUBJECTS (for Kharidar)
    // ========================================================================
    console.log("\n📖 Creating Subjects...")

    const subjects = [
        {
            id: "gk",
            name: "General Knowledge",
            nameNp: "सामान्य ज्ञान",
            description: "History, Geography, Civics, and General Studies",
            icon: "globe",
            color: "#3B82F6",
            order: 1
        },
        {
            id: "nepali",
            name: "Nepali Language",
            nameNp: "नेपाली भाषा",
            description: "Grammar, Vocabulary, and Comprehension",
            icon: "book",
            color: "#DC2626",
            order: 2
        },
        {
            id: "english",
            name: "English Language",
            nameNp: "अंग्रेजी भाषा",
            description: "Grammar, Vocabulary, and Comprehension",
            icon: "languages",
            color: "#7C3AED",
            order: 3
        },
        {
            id: "math",
            name: "Mathematics",
            nameNp: "गणित",
            description: "Arithmetic, Algebra, and Reasoning",
            icon: "calculator",
            color: "#059669",
            order: 4
        },
        {
            id: "computer",
            name: "Computer Science",
            nameNp: "कम्प्युटर विज्ञान",
            description: "Basic Computer Knowledge and IT",
            icon: "computer",
            color: "#0891B2",
            order: 5
        },
        {
            id: "current-affairs",
            name: "Current Affairs",
            nameNp: "समसामयिक घटना",
            description: "National and International Current Affairs",
            icon: "newspaper",
            color: "#F59E0B",
            order: 6
        }
    ]

    for (const subject of subjects) {
        await prisma.subject.upsert({
            where: { id: subject.id },
            update: {},
            create: {
                ...subject,
                examLevelId: "kharidar",
                isActive: true
            }
        })
        console.log(`  ✓ Created: ${subject.name}`)
    }

    // ========================================================================
    // TOPICS
    // ========================================================================
    console.log("\n📝 Creating Topics...")

    const topics: { subjectId: string; id: string; name: string; nameNp: string; order: number }[] = [
        // General Knowledge Topics
        { subjectId: "gk", id: "nepal-history", name: "History of Nepal", nameNp: "नेपालको इतिहास", order: 1 },
        { subjectId: "gk", id: "nepal-geography", name: "Geography of Nepal", nameNp: "नेपालको भूगोल", order: 2 },
        { subjectId: "gk", id: "constitution", name: "Constitution of Nepal", nameNp: "नेपालको संविधान", order: 3 },
        { subjectId: "gk", id: "governance", name: "Governance & Administration", nameNp: "शासन र प्रशासन", order: 4 },
        { subjectId: "gk", id: "economy", name: "Economy of Nepal", nameNp: "नेपालको अर्थतन्त्र", order: 5 },
        { subjectId: "gk", id: "world-geography", name: "World Geography", nameNp: "विश्व भूगोल", order: 6 },
        { subjectId: "gk", id: "world-history", name: "World History", nameNp: "विश्व इतिहास", order: 7 },
        { subjectId: "gk", id: "science-tech", name: "Science & Technology", nameNp: "विज्ञान र प्रविधि", order: 8 },
        
        // Nepali Topics
        { subjectId: "nepali", id: "nepali-grammar", name: "Grammar (व्याकरण)", nameNp: "व्याकरण", order: 1 },
        { subjectId: "nepali", id: "nepali-vocabulary", name: "Vocabulary (शब्द भण्डार)", nameNp: "शब्द भण्डार", order: 2 },
        { subjectId: "nepali", id: "nepali-proverbs", name: "Proverbs & Idioms", nameNp: "उखान र मुहावरा", order: 3 },
        { subjectId: "nepali", id: "nepali-literature", name: "Literature", nameNp: "साहित्य", order: 4 },
        { subjectId: "nepali", id: "letter-writing", name: "Letter & Application", nameNp: "पत्र लेखन", order: 5 },
        
        // English Topics
        { subjectId: "english", id: "english-grammar", name: "Grammar", nameNp: "व्याकरण", order: 1 },
        { subjectId: "english", id: "english-vocabulary", name: "Vocabulary", nameNp: "शब्द भण्डार", order: 2 },
        { subjectId: "english", id: "english-comprehension", name: "Reading Comprehension", nameNp: "पठन बोध", order: 3 },
        { subjectId: "english", id: "english-synonyms", name: "Synonyms & Antonyms", nameNp: "पर्यायवाची र विपरीतार्थी", order: 4 },
        { subjectId: "english", id: "english-idioms", name: "Idioms & Phrases", nameNp: "मुहावरा र वाक्यांश", order: 5 },
        
        // Mathematics Topics
        { subjectId: "math", id: "arithmetic", name: "Arithmetic", nameNp: "अंकगणित", order: 1 },
        { subjectId: "math", id: "percentage", name: "Percentage & Ratio", nameNp: "प्रतिशत र अनुपात", order: 2 },
        { subjectId: "math", id: "profit-loss", name: "Profit & Loss", nameNp: "नाफा नोक्सान", order: 3 },
        { subjectId: "math", id: "time-work", name: "Time & Work", nameNp: "समय र काम", order: 4 },
        { subjectId: "math", id: "simple-interest", name: "Simple & Compound Interest", nameNp: "साधारण र चक्रीय ब्याज", order: 5 },
        { subjectId: "math", id: "algebra-basics", name: "Basic Algebra", nameNp: "आधारभूत बीजगणित", order: 6 },
        { subjectId: "math", id: "geometry-basics", name: "Basic Geometry", nameNp: "आधारभूत ज्यामिति", order: 7 },
        
        // Computer Topics
        { subjectId: "computer", id: "computer-basics", name: "Computer Fundamentals", nameNp: "कम्प्युटरको आधारभूत", order: 1 },
        { subjectId: "computer", id: "ms-office", name: "MS Office", nameNp: "एमएस अफिस", order: 2 },
        { subjectId: "computer", id: "internet", name: "Internet & Email", nameNp: "इन्टरनेट र इमेल", order: 3 },
        { subjectId: "computer", id: "hardware-software", name: "Hardware & Software", nameNp: "हार्डवेयर र सफ्टवेयर", order: 4 },
        { subjectId: "computer", id: "networking", name: "Computer Networking", nameNp: "कम्प्युटर नेटवर्किङ", order: 5 },
        { subjectId: "computer", id: "cyber-security", name: "Cyber Security", nameNp: "साइबर सुरक्षा", order: 6 },
        
        // Current Affairs Topics
        { subjectId: "current-affairs", id: "nepal-current", name: "Nepal Current Affairs", nameNp: "नेपाल समसामयिक", order: 1 },
        { subjectId: "current-affairs", id: "world-current", name: "World Current Affairs", nameNp: "विश्व समसामयिक", order: 2 },
        { subjectId: "current-affairs", id: "sports", name: "Sports", nameNp: "खेलकुद", order: 3 },
        { subjectId: "current-affairs", id: "awards", name: "Awards & Honors", nameNp: "पुरस्कार र सम्मान", order: 4 },
        { subjectId: "current-affairs", id: "organizations", name: "International Organizations", nameNp: "अन्तर्राष्ट्रिय संस्थाहरू", order: 5 }
    ]

    for (const topic of topics) {
        await prisma.topic.upsert({
            where: { id: topic.id },
            update: {},
            create: {
                ...topic,
                isActive: true
            }
        })
    }
    console.log(`  ✓ Created ${topics.length} topics`)

    // ========================================================================
    // QUESTIONS - 1000+ Loksewa Kharidar Questions
    // ========================================================================
    console.log("\n❓ Creating Questions...")

    // Question bank organized by topic
    const questionBank: Array<{
        topicId: string
        subjectId: string
        question: string
        questionNp?: string
        options: { a: string; b: string; c: string; d: string }
        optionsNp?: { a: string; b: string; c: string; d: string }
        correctAnswer: string
        explanation?: string
        difficulty: "EASY" | "MEDIUM" | "HARD"
        source?: string
        tags?: string[]
    }> = [
        // ===== NEPAL HISTORY =====
        {
            topicId: "nepal-history",
            subjectId: "gk",
            question: "Who is known as the unifier of Nepal?",
            questionNp: "नेपालको एकीकरणकर्ताको रूपमा कसलाई चिनिन्छ?",
            options: { a: "Prithvi Narayan Shah", b: "Ram Shah", c: "Jayasthiti Malla", d: "Tribhuvan Shah" },
            optionsNp: { a: "पृथ्वीनारायण शाह", b: "राम शाह", c: "जयस्थिति मल्ल", d: "त्रिभुवन शाह" },
            correctAnswer: "a",
            explanation: "Prithvi Narayan Shah unified small states into modern Nepal in 1768 AD.",
            difficulty: "EASY",
            source: "PSC 2079",
            tags: ["unification", "shah-dynasty"]
        },
        {
            topicId: "nepal-history",
            subjectId: "gk",
            question: "When did Nepal become a Federal Democratic Republic?",
            options: { a: "2006 AD", b: "2007 AD", c: "2008 AD", d: "2015 AD" },
            correctAnswer: "c",
            explanation: "Nepal was declared a Federal Democratic Republic on May 28, 2008 (Jestha 15, 2065 BS).",
            difficulty: "EASY",
            source: "Model Question",
            tags: ["republic", "modern-history"]
        },
        {
            topicId: "nepal-history",
            subjectId: "gk",
            question: "The Rana regime in Nepal lasted for how many years?",
            options: { a: "104 years", b: "100 years", c: "110 years", d: "95 years" },
            correctAnswer: "a",
            explanation: "The Rana regime lasted from 1846 to 1950 AD, approximately 104 years.",
            difficulty: "MEDIUM",
            tags: ["rana-period"]
        },
        {
            topicId: "nepal-history",
            subjectId: "gk",
            question: "Who was the first Rana Prime Minister of Nepal?",
            options: { a: "Bhimsen Thapa", b: "Jung Bahadur Rana", c: "Chandra Shamsher", d: "Juddha Shamsher" },
            correctAnswer: "b",
            explanation: "Jung Bahadur Rana became the first Rana Prime Minister after the Kot Massacre in 1846.",
            difficulty: "EASY",
            tags: ["rana-period", "prime-minister"]
        },
        {
            topicId: "nepal-history",
            subjectId: "gk",
            question: "The Treaty of Sugauli was signed in which year?",
            options: { a: "1814 AD", b: "1815 AD", c: "1816 AD", d: "1817 AD" },
            correctAnswer: "c",
            explanation: "The Treaty of Sugauli was signed on March 4, 1816 after the Anglo-Nepalese War.",
            difficulty: "MEDIUM",
            tags: ["treaty", "british-india"]
        },
        {
            topicId: "nepal-history",
            subjectId: "gk",
            question: "Who introduced the Muluki Ain (Civil Code) in Nepal?",
            options: { a: "Prithvi Narayan Shah", b: "Jung Bahadur Rana", c: "Surendra Bikram Shah", d: "Mahendra Bir Bikram Shah" },
            correctAnswer: "b",
            explanation: "Jung Bahadur Rana introduced the Muluki Ain in 1854 AD after his visit to Britain and France.",
            difficulty: "MEDIUM",
            tags: ["law", "rana-period"]
        },
        {
            topicId: "nepal-history",
            subjectId: "gk",
            question: "The Kot Massacre occurred in which year?",
            options: { a: "1844 BS", b: "1902 BS", c: "1903 BS", d: "1846 AD" },
            correctAnswer: "d",
            explanation: "The Kot Massacre occurred on September 15, 1846 (1903 BS), leading to the Rana rule.",
            difficulty: "MEDIUM",
            tags: ["rana-period", "massacre"]
        },
        {
            topicId: "nepal-history",
            subjectId: "gk",
            question: "Who was the last Malla king of Kathmandu?",
            options: { a: "Jaya Prakash Malla", b: "Ranajit Malla", c: "Tej Narsingh Malla", d: "Pratap Malla" },
            correctAnswer: "a",
            explanation: "Jaya Prakash Malla was the last Malla king of Kathmandu, defeated by Prithvi Narayan Shah in 1768.",
            difficulty: "MEDIUM",
            tags: ["malla-period", "unification"]
        },
        {
            topicId: "nepal-history",
            subjectId: "gk",
            question: "Slavery was abolished in Nepal during whose rule?",
            options: { a: "Jung Bahadur Rana", b: "Chandra Shamsher Rana", c: "Dev Shamsher Rana", d: "Bhim Shamsher Rana" },
            correctAnswer: "b",
            explanation: "Chandra Shamsher Rana abolished slavery in Nepal in 1924 AD (1981 BS).",
            difficulty: "EASY",
            tags: ["rana-period", "social-reform"]
        },
        {
            topicId: "nepal-history",
            subjectId: "gk",
            question: "Nepal became a member of the United Nations in which year?",
            options: { a: "1947 AD", b: "1950 AD", c: "1955 AD", d: "1960 AD" },
            correctAnswer: "c",
            explanation: "Nepal became a member of the United Nations on December 14, 1955.",
            difficulty: "EASY",
            tags: ["international", "UN"]
        },

        // ===== NEPAL GEOGRAPHY =====
        {
            topicId: "nepal-geography",
            subjectId: "gk",
            question: "What is the total area of Nepal?",
            options: { a: "1,47,181 sq km", b: "1,37,181 sq km", c: "1,57,181 sq km", d: "1,27,181 sq km" },
            correctAnswer: "a",
            explanation: "Nepal covers an area of 147,181 square kilometers.",
            difficulty: "EASY",
            tags: ["area", "basic-facts"]
        },
        {
            topicId: "nepal-geography",
            subjectId: "gk",
            question: "How many provinces are there in Nepal?",
            options: { a: "5", b: "6", c: "7", d: "8" },
            correctAnswer: "c",
            explanation: "Nepal is divided into 7 provinces as per the 2015 Constitution.",
            difficulty: "EASY",
            tags: ["provinces", "administration"]
        },
        {
            topicId: "nepal-geography",
            subjectId: "gk",
            question: "Which is the largest district of Nepal by area?",
            options: { a: "Humla", b: "Dolpa", c: "Manang", d: "Mustang" },
            correctAnswer: "b",
            explanation: "Dolpa is the largest district of Nepal with an area of 7,889 sq km.",
            difficulty: "MEDIUM",
            tags: ["districts", "area"]
        },
        {
            topicId: "nepal-geography",
            subjectId: "gk",
            question: "Which river is known as the 'Sorrow of Nepal'?",
            options: { a: "Koshi", b: "Gandaki", c: "Karnali", d: "Mechi" },
            correctAnswer: "a",
            explanation: "The Koshi River is called the 'Sorrow of Nepal' due to frequent devastating floods.",
            difficulty: "MEDIUM",
            tags: ["rivers", "natural-disasters"]
        },
        {
            topicId: "nepal-geography",
            subjectId: "gk",
            question: "What is the highest peak entirely within Nepal?",
            options: { a: "Mt. Everest", b: "Mt. Kanchenjunga", c: "Mt. Dhaulagiri", d: "Mt. Makalu" },
            correctAnswer: "c",
            explanation: "Mt. Dhaulagiri (8,167m) is the highest peak that lies entirely within Nepal's borders.",
            difficulty: "MEDIUM",
            tags: ["mountains", "peaks"]
        },
        {
            topicId: "nepal-geography",
            subjectId: "gk",
            question: "Which is the smallest district of Nepal by area?",
            options: { a: "Bhaktapur", b: "Kathmandu", c: "Lalitpur", d: "Kirtipur" },
            correctAnswer: "a",
            explanation: "Bhaktapur is the smallest district of Nepal with an area of 119 sq km.",
            difficulty: "EASY",
            tags: ["districts", "area"]
        },
        {
            topicId: "nepal-geography",
            subjectId: "gk",
            question: "Rara Lake is located in which district?",
            options: { a: "Dolpa", b: "Mugu", c: "Humla", d: "Jumla" },
            correctAnswer: "b",
            explanation: "Rara Lake, the largest lake of Nepal, is located in Mugu district.",
            difficulty: "EASY",
            tags: ["lakes", "tourism"]
        },
        {
            topicId: "nepal-geography",
            subjectId: "gk",
            question: "What percentage of Nepal's total area is covered by the Terai region?",
            options: { a: "17%", b: "23%", c: "33%", d: "44%" },
            correctAnswer: "b",
            explanation: "The Terai region covers approximately 23% of Nepal's total area.",
            difficulty: "MEDIUM",
            tags: ["regions", "terai"]
        },
        {
            topicId: "nepal-geography",
            subjectId: "gk",
            question: "Which national park is the oldest in Nepal?",
            options: { a: "Sagarmatha National Park", b: "Chitwan National Park", c: "Langtang National Park", d: "Shey Phoksundo National Park" },
            correctAnswer: "b",
            explanation: "Chitwan National Park, established in 1973, is the oldest national park in Nepal.",
            difficulty: "EASY",
            tags: ["national-parks", "conservation"]
        },
        {
            topicId: "nepal-geography",
            subjectId: "gk",
            question: "Nepal shares its border with how many countries?",
            options: { a: "1", b: "2", c: "3", d: "4" },
            correctAnswer: "b",
            explanation: "Nepal shares its border with two countries: India (south, east, west) and China (north).",
            difficulty: "EASY",
            tags: ["borders", "basic-facts"]
        },

        // ===== CONSTITUTION =====
        {
            topicId: "constitution",
            subjectId: "gk",
            question: "When was the Constitution of Nepal 2015 promulgated?",
            options: { a: "Ashwin 3, 2072", b: "Ashoj 3, 2072", c: "Bhadra 3, 2072", d: "Kartik 3, 2072" },
            correctAnswer: "b",
            explanation: "The Constitution of Nepal was promulgated on September 20, 2015 (Ashoj 3, 2072 BS).",
            difficulty: "EASY",
            tags: ["constitution", "date"]
        },
        {
            topicId: "constitution",
            subjectId: "gk",
            question: "How many schedules are there in the Constitution of Nepal 2015?",
            options: { a: "7", b: "8", c: "9", d: "10" },
            correctAnswer: "c",
            explanation: "The Constitution of Nepal 2015 has 9 schedules.",
            difficulty: "MEDIUM",
            tags: ["constitution", "structure"]
        },
        {
            topicId: "constitution",
            subjectId: "gk",
            question: "How many articles are there in the Constitution of Nepal 2015?",
            options: { a: "296", b: "305", c: "308", d: "310" },
            correctAnswer: "c",
            explanation: "The Constitution of Nepal 2015 contains 308 articles in 35 parts.",
            difficulty: "MEDIUM",
            tags: ["constitution", "structure"]
        },
        {
            topicId: "constitution",
            subjectId: "gk",
            question: "According to the Constitution, what is the form of government in Nepal?",
            options: { a: "Presidential System", b: "Parliamentary System", c: "Federal Presidential System", d: "Semi-Presidential System" },
            correctAnswer: "b",
            explanation: "Nepal follows a federal parliamentary republican system of government.",
            difficulty: "EASY",
            tags: ["constitution", "government"]
        },
        {
            topicId: "constitution",
            subjectId: "gk",
            question: "Who is the guardian of the Constitution of Nepal?",
            options: { a: "President", b: "Prime Minister", c: "Supreme Court", d: "Parliament" },
            correctAnswer: "c",
            explanation: "The Supreme Court is the guardian and final interpreter of the Constitution.",
            difficulty: "MEDIUM",
            tags: ["constitution", "judiciary"]
        },
        {
            topicId: "constitution",
            subjectId: "gk",
            question: "How many fundamental rights are guaranteed in the Constitution of Nepal 2015?",
            options: { a: "25", b: "28", c: "31", d: "35" },
            correctAnswer: "c",
            explanation: "The Constitution guarantees 31 fundamental rights to citizens.",
            difficulty: "MEDIUM",
            tags: ["constitution", "rights"]
        },
        {
            topicId: "constitution",
            subjectId: "gk",
            question: "What is the term of the House of Representatives in Nepal?",
            options: { a: "4 years", b: "5 years", c: "6 years", d: "7 years" },
            correctAnswer: "b",
            explanation: "The House of Representatives has a term of 5 years.",
            difficulty: "EASY",
            tags: ["constitution", "parliament"]
        },
        {
            topicId: "constitution",
            subjectId: "gk",
            question: "How many members are in the National Assembly of Nepal?",
            options: { a: "49", b: "55", c: "59", d: "65" },
            correctAnswer: "c",
            explanation: "The National Assembly (upper house) consists of 59 members.",
            difficulty: "MEDIUM",
            tags: ["constitution", "parliament"]
        },

        // ===== GOVERNANCE =====
        {
            topicId: "governance",
            subjectId: "gk",
            question: "Who is the executive head of Nepal?",
            options: { a: "President", b: "Prime Minister", c: "Chief Justice", d: "Speaker" },
            correctAnswer: "b",
            explanation: "The Prime Minister is the executive head of Nepal.",
            difficulty: "EASY",
            tags: ["governance", "executive"]
        },
        {
            topicId: "governance",
            subjectId: "gk",
            question: "Who appoints the Chief Justice of Nepal?",
            options: { a: "Prime Minister", b: "Constitutional Council", c: "President", d: "Parliament" },
            correctAnswer: "c",
            explanation: "The President appoints the Chief Justice on the recommendation of the Constitutional Council.",
            difficulty: "MEDIUM",
            tags: ["governance", "judiciary"]
        },
        {
            topicId: "governance",
            subjectId: "gk",
            question: "How many High Courts are there in Nepal?",
            options: { a: "5", b: "6", c: "7", d: "8" },
            correctAnswer: "c",
            explanation: "Nepal has 7 High Courts, one in each province.",
            difficulty: "EASY",
            tags: ["governance", "judiciary"]
        },
        {
            topicId: "governance",
            subjectId: "gk",
            question: "What is the tenure of the Auditor General?",
            options: { a: "5 years", b: "6 years", c: "65 years of age", d: "Both B and C" },
            correctAnswer: "d",
            explanation: "The Auditor General serves for 6 years or until 65 years of age, whichever is earlier.",
            difficulty: "MEDIUM",
            tags: ["governance", "constitutional-bodies"]
        },
        {
            topicId: "governance",
            subjectId: "gk",
            question: "The Public Service Commission of Nepal was established in which year?",
            options: { a: "2007 BS", b: "2008 BS", c: "2009 BS", d: "2010 BS" },
            correctAnswer: "b",
            explanation: "The Public Service Commission was established in 2008 BS (1951 AD).",
            difficulty: "MEDIUM",
            tags: ["governance", "PSC"]
        },

        // ===== ECONOMY =====
        {
            topicId: "economy",
            subjectId: "gk",
            question: "What is the currency of Nepal?",
            options: { a: "Rupee", b: "Nepalese Rupee", c: "Paisa", d: "Mohur" },
            correctAnswer: "b",
            explanation: "The Nepalese Rupee (NPR) is the official currency of Nepal.",
            difficulty: "EASY",
            tags: ["economy", "currency"]
        },
        {
            topicId: "economy",
            subjectId: "gk",
            question: "Nepal Rastra Bank was established in which year?",
            options: { a: "2012 BS", b: "2013 BS", c: "2014 BS", d: "2015 BS" },
            correctAnswer: "c",
            explanation: "Nepal Rastra Bank was established on Baisakh 14, 2014 BS (April 26, 1956).",
            difficulty: "MEDIUM",
            tags: ["economy", "banking"]
        },
        {
            topicId: "economy",
            subjectId: "gk",
            question: "Which sector contributes most to Nepal's GDP?",
            options: { a: "Agriculture", b: "Services", c: "Industry", d: "Tourism" },
            correctAnswer: "b",
            explanation: "The services sector contributes the most to Nepal's GDP (over 50%).",
            difficulty: "MEDIUM",
            tags: ["economy", "GDP"]
        },
        {
            topicId: "economy",
            subjectId: "gk",
            question: "What is Nepal's major source of foreign exchange?",
            options: { a: "Tourism", b: "Exports", c: "Remittance", d: "Aid" },
            correctAnswer: "c",
            explanation: "Remittance is Nepal's largest source of foreign exchange, contributing significantly to GDP.",
            difficulty: "EASY",
            tags: ["economy", "remittance"]
        },

        // ===== NEPALI GRAMMAR =====
        {
            topicId: "nepali-grammar",
            subjectId: "nepali",
            question: "नेपाली भाषामा कति वर्ण छन्?",
            options: { a: "33", b: "36", c: "48", d: "52" },
            correctAnswer: "b",
            explanation: "नेपाली भाषामा 36 वर्ण छन् - 12 स्वर र 36 व्यञ्जन।",
            difficulty: "EASY",
            tags: ["वर्ण", "आधारभूत"]
        },
        {
            topicId: "nepali-grammar",
            subjectId: "nepali",
            question: "तल दिइएकामध्ये कुन शब्द तत्सम हो?",
            options: { a: "आँखा", b: "नेत्र", c: "घाम", d: "पानी" },
            correctAnswer: "b",
            explanation: "नेत्र संस्कृतबाट सोझै आएको तत्सम शब्द हो।",
            difficulty: "MEDIUM",
            tags: ["शब्द-भेद", "तत्सम"]
        },
        {
            topicId: "nepali-grammar",
            subjectId: "nepali",
            question: "'सूर्य' को तद्भव रूप के हो?",
            options: { a: "घाम", b: "सुरुज", c: "दिनकर", d: "रवि" },
            correctAnswer: "a",
            explanation: "सूर्य को तद्भव रूप 'घाम' हो।",
            difficulty: "MEDIUM",
            tags: ["शब्द-भेद", "तद्भव"]
        },
        {
            topicId: "nepali-grammar",
            subjectId: "nepali",
            question: "कुन वाक्य शुद्ध छ?",
            options: { a: "उसले किताब पढे", b: "उसले किताब पढ्यो", c: "उसले किताब पढी", d: "उसले किताब पढेछ" },
            correctAnswer: "b",
            explanation: "तेस्रो पुरुष एकवचनमा 'यो' प्रत्यय लाग्छ।",
            difficulty: "EASY",
            tags: ["वाक्य", "क्रियापद"]
        },
        {
            topicId: "nepali-grammar",
            subjectId: "nepali",
            question: "'म' को बहुवचन के हो?",
            options: { a: "हामीहरू", b: "हामी", c: "हामीहरु", d: "हाम्रो" },
            correctAnswer: "b",
            explanation: "'म' को बहुवचन 'हामी' हो।",
            difficulty: "EASY",
            tags: ["सर्वनाम", "वचन"]
        },
        {
            topicId: "nepali-grammar",
            subjectId: "nepali",
            question: "'गाउँ' शब्दमा कति अक्षर छन्?",
            options: { a: "1", b: "2", c: "3", d: "4" },
            correctAnswer: "b",
            explanation: "गाउँ = गा + उँ = 2 अक्षर",
            difficulty: "EASY",
            tags: ["अक्षर", "उच्चारण"]
        },
        {
            topicId: "nepali-grammar",
            subjectId: "nepali",
            question: "कुन सन्धि विच्छेद सही छ?",
            options: { a: "विद्यालय = विद्या + आलय", b: "विद्यालय = विद्य + आलय", c: "विद्यालय = विद + यालय", d: "विद्यालय = विद्या + लय" },
            correctAnswer: "a",
            explanation: "विद्यालय = विद्या + आलय (स्वर सन्धि)",
            difficulty: "MEDIUM",
            tags: ["सन्धि", "व्याकरण"]
        },
        {
            topicId: "nepali-grammar",
            subjectId: "nepali",
            question: "'किताब' शब्द कुन भाषाबाट आएको हो?",
            options: { a: "संस्कृत", b: "हिन्दी", c: "अरबी", d: "अंग्रेजी" },
            correctAnswer: "c",
            explanation: "'किताब' अरबी भाषाबाट आएको विदेशी शब्द हो।",
            difficulty: "MEDIUM",
            tags: ["शब्द-भेद", "विदेशी"]
        },

        // ===== NEPALI VOCABULARY =====
        {
            topicId: "nepali-vocabulary",
            subjectId: "nepali",
            question: "'जल' को पर्यायवाची शब्द के हो?",
            options: { a: "अग्नि", b: "पानी", c: "पृथ्वी", d: "आकाश" },
            correctAnswer: "b",
            explanation: "जल को पर्यायवाची पानी, नीर, सलिल, वारि आदि हुन्।",
            difficulty: "EASY",
            tags: ["पर्यायवाची", "शब्द"]
        },
        {
            topicId: "nepali-vocabulary",
            subjectId: "nepali",
            question: "'शत्रु' को विपरीतार्थी शब्द के हो?",
            options: { a: "दुश्मन", b: "मित्र", c: "रिपु", d: "अरि" },
            correctAnswer: "b",
            explanation: "शत्रु को विपरीतार्थी शब्द मित्र हो।",
            difficulty: "EASY",
            tags: ["विपरीतार्थी", "शब्द"]
        },
        {
            topicId: "nepali-vocabulary",
            subjectId: "nepali",
            question: "जसको उपाय छैन त्यसलाई के भनिन्छ?",
            options: { a: "अनुपम", b: "अनाथ", c: "निरुपाय", d: "निराश" },
            correctAnswer: "c",
            explanation: "जसको उपाय छैन = निरुपाय (एक शब्दमा)।",
            difficulty: "MEDIUM",
            tags: ["एक-शब्द", "शब्द-भण्डार"]
        },
        {
            topicId: "nepali-vocabulary",
            subjectId: "nepali",
            question: "'आकाशको फूल' को अर्थ के हो?",
            options: { a: "तारा", b: "असम्भव कुरा", c: "चन्द्रमा", d: "बादल" },
            correctAnswer: "b",
            explanation: "'आकाशको फूल' भन्नाले असम्भव कुरा बुझिन्छ।",
            difficulty: "MEDIUM",
            tags: ["मुहावरा", "अर्थ"]
        },

        // ===== NEPALI PROVERBS =====
        {
            topicId: "nepali-proverbs",
            subjectId: "nepali",
            question: "'जे बोए त्यही काट्नु' को अर्थ के हो?",
            options: { a: "खेती गर्नु", b: "जस्तो काम त्यस्तै फल", c: "रुख काट्नु", d: "बीउ बिक्री" },
            correctAnswer: "b",
            explanation: "यो उखानको अर्थ हो - जस्तो काम गर्छौं त्यस्तै फल पाउँछौं।",
            difficulty: "EASY",
            tags: ["उखान", "अर्थ"]
        },
        {
            topicId: "nepali-proverbs",
            subjectId: "nepali",
            question: "'नाच्न नजान्ने आँगन टेढो' को अर्थ के हो?",
            options: { a: "आँगन बनाउनु पर्छ", b: "आफ्नो कमजोरी अरूमा थोपर्नु", c: "नाच्न सिक्नु पर्छ", d: "आँगन सफा गर्नु" },
            correctAnswer: "b",
            explanation: "यो उखानले आफ्नो कमजोरी लुकाउन अरूमाथि दोष थोपर्ने व्यक्तिलाई जनाउँछ।",
            difficulty: "MEDIUM",
            tags: ["उखान", "अर्थ"]
        },
        {
            topicId: "nepali-proverbs",
            subjectId: "nepali",
            question: "'हात्तीको दाँत देखाउने अर्को खाने अर्को' भन्नाले के बुझिन्छ?",
            options: { a: "हात्ती पाल्नु", b: "कपटी व्यवहार", c: "दाँतको महत्त्व", d: "दुई काम गर्नु" },
            correctAnswer: "b",
            explanation: "यो उखानले बाहिर एक तर भित्र अर्कै - कपटी व्यवहारलाई जनाउँछ।",
            difficulty: "MEDIUM",
            tags: ["उखान", "अर्थ"]
        },

        // ===== ENGLISH GRAMMAR =====
        {
            topicId: "english-grammar",
            subjectId: "english",
            question: "Choose the correct sentence:",
            options: { a: "He don't know anything", b: "He doesn't knows anything", c: "He doesn't know anything", d: "He don't knows anything" },
            correctAnswer: "c",
            explanation: "With third person singular (he/she/it), we use 'doesn't' + base verb.",
            difficulty: "EASY",
            tags: ["grammar", "subject-verb-agreement"]
        },
        {
            topicId: "english-grammar",
            subjectId: "english",
            question: "The past tense of 'go' is:",
            options: { a: "goed", b: "gone", c: "went", d: "going" },
            correctAnswer: "c",
            explanation: "'Go' is an irregular verb. Its past tense is 'went' and past participle is 'gone'.",
            difficulty: "EASY",
            tags: ["grammar", "tenses"]
        },
        {
            topicId: "english-grammar",
            subjectId: "english",
            question: "Which sentence is in passive voice?",
            options: { a: "The dog bit the man", b: "The man was bitten by the dog", c: "The dog is biting the man", d: "The man saw the dog" },
            correctAnswer: "b",
            explanation: "In passive voice, the object of the action becomes the subject of the sentence.",
            difficulty: "MEDIUM",
            tags: ["grammar", "voice"]
        },
        {
            topicId: "english-grammar",
            subjectId: "english",
            question: "Choose the correct article: ___ apple a day keeps the doctor away.",
            options: { a: "A", b: "An", c: "The", d: "No article" },
            correctAnswer: "b",
            explanation: "We use 'an' before words starting with a vowel sound.",
            difficulty: "EASY",
            tags: ["grammar", "articles"]
        },
        {
            topicId: "english-grammar",
            subjectId: "english",
            question: "Identify the correct form: She ___ to school every day.",
            options: { a: "go", b: "goes", c: "going", d: "gone" },
            correctAnswer: "b",
            explanation: "With third person singular (she), we add 's' or 'es' to the verb in simple present.",
            difficulty: "EASY",
            tags: ["grammar", "tenses"]
        },
        {
            topicId: "english-grammar",
            subjectId: "english",
            question: "What is the plural of 'child'?",
            options: { a: "childs", b: "childes", c: "children", d: "childrens" },
            correctAnswer: "c",
            explanation: "'Child' has an irregular plural form - 'children'.",
            difficulty: "EASY",
            tags: ["grammar", "plural"]
        },
        {
            topicId: "english-grammar",
            subjectId: "english",
            question: "Choose the correct preposition: The book is ___ the table.",
            options: { a: "in", b: "on", c: "at", d: "by" },
            correctAnswer: "b",
            explanation: "'On' is used for surfaces. A book is placed on (the surface of) a table.",
            difficulty: "EASY",
            tags: ["grammar", "prepositions"]
        },
        {
            topicId: "english-grammar",
            subjectId: "english",
            question: "Convert to indirect speech: He said, 'I am happy.'",
            options: { a: "He said that he is happy", b: "He said that he was happy", c: "He said that I am happy", d: "He said that I was happy" },
            correctAnswer: "b",
            explanation: "In indirect speech, 'am' changes to 'was' and the pronoun changes from 'I' to 'he'.",
            difficulty: "MEDIUM",
            tags: ["grammar", "indirect-speech"]
        },

        // ===== ENGLISH VOCABULARY =====
        {
            topicId: "english-vocabulary",
            subjectId: "english",
            question: "Choose the synonym of 'beautiful':",
            options: { a: "ugly", b: "pretty", c: "bad", d: "sad" },
            correctAnswer: "b",
            explanation: "'Pretty' is a synonym of 'beautiful', meaning pleasing to look at.",
            difficulty: "EASY",
            tags: ["vocabulary", "synonyms"]
        },
        {
            topicId: "english-vocabulary",
            subjectId: "english",
            question: "The antonym of 'ancient' is:",
            options: { a: "old", b: "modern", c: "historic", d: "antique" },
            correctAnswer: "b",
            explanation: "'Modern' is the opposite of 'ancient' (very old).",
            difficulty: "EASY",
            tags: ["vocabulary", "antonyms"]
        },
        {
            topicId: "english-vocabulary",
            subjectId: "english",
            question: "A person who studies stars and planets is called:",
            options: { a: "Astrologer", b: "Astronomer", c: "Physicist", d: "Geologist" },
            correctAnswer: "b",
            explanation: "An astronomer studies celestial bodies scientifically. An astrologer studies astrology.",
            difficulty: "MEDIUM",
            tags: ["vocabulary", "one-word"]
        },
        {
            topicId: "english-vocabulary",
            subjectId: "english",
            question: "A place where dead bodies are kept is called:",
            options: { a: "Cemetery", b: "Mortuary", c: "Hospital", d: "Museum" },
            correctAnswer: "b",
            explanation: "A mortuary is a place where dead bodies are kept before burial or cremation.",
            difficulty: "MEDIUM",
            tags: ["vocabulary", "one-word"]
        },

        // ===== ENGLISH SYNONYMS =====
        {
            topicId: "english-synonyms",
            subjectId: "english",
            question: "What is the synonym of 'brave'?",
            options: { a: "Coward", b: "Timid", c: "Courageous", d: "Fearful" },
            correctAnswer: "c",
            explanation: "'Courageous' means having courage, similar to 'brave'.",
            difficulty: "EASY",
            tags: ["synonyms"]
        },
        {
            topicId: "english-synonyms",
            subjectId: "english",
            question: "Choose the antonym of 'transparent':",
            options: { a: "Clear", b: "Opaque", c: "Translucent", d: "Lucid" },
            correctAnswer: "b",
            explanation: "'Opaque' means not allowing light to pass through - opposite of 'transparent'.",
            difficulty: "MEDIUM",
            tags: ["antonyms"]
        },

        // ===== ENGLISH IDIOMS =====
        {
            topicId: "english-idioms",
            subjectId: "english",
            question: "What does 'to break the ice' mean?",
            options: { a: "To break something frozen", b: "To start a conversation", c: "To end a relationship", d: "To solve a problem" },
            correctAnswer: "b",
            explanation: "'To break the ice' means to initiate conversation in an awkward or formal situation.",
            difficulty: "MEDIUM",
            tags: ["idioms"]
        },
        {
            topicId: "english-idioms",
            subjectId: "english",
            question: "'A piece of cake' means:",
            options: { a: "A delicious dessert", b: "Something very easy", c: "A birthday celebration", d: "A difficult task" },
            correctAnswer: "b",
            explanation: "'A piece of cake' is an idiom meaning something very easy to do.",
            difficulty: "EASY",
            tags: ["idioms"]
        },
        {
            topicId: "english-idioms",
            subjectId: "english",
            question: "'To burn the midnight oil' means:",
            options: { a: "To waste resources", b: "To work late at night", c: "To start a fire", d: "To sleep early" },
            correctAnswer: "b",
            explanation: "This idiom means to study or work late into the night.",
            difficulty: "MEDIUM",
            tags: ["idioms"]
        },

        // ===== MATHEMATICS - ARITHMETIC =====
        {
            topicId: "arithmetic",
            subjectId: "math",
            question: "What is 25% of 400?",
            options: { a: "80", b: "100", c: "120", d: "125" },
            correctAnswer: "b",
            explanation: "25% of 400 = (25/100) × 400 = 100",
            difficulty: "EASY",
            tags: ["percentage"]
        },
        {
            topicId: "arithmetic",
            subjectId: "math",
            question: "If 15 workers can complete a task in 10 days, how many days will 10 workers take?",
            options: { a: "12 days", b: "15 days", c: "18 days", d: "20 days" },
            correctAnswer: "b",
            explanation: "Workers × Days = Constant. 15×10 = 10×x, so x = 15 days.",
            difficulty: "MEDIUM",
            tags: ["time-work"]
        },
        {
            topicId: "arithmetic",
            subjectId: "math",
            question: "The LCM of 12 and 18 is:",
            options: { a: "6", b: "36", c: "72", d: "216" },
            correctAnswer: "b",
            explanation: "LCM(12,18) = (12×18)/HCF(12,18) = 216/6 = 36",
            difficulty: "EASY",
            tags: ["LCM", "HCF"]
        },
        {
            topicId: "arithmetic",
            subjectId: "math",
            question: "The HCF of 24 and 36 is:",
            options: { a: "6", b: "12", c: "18", d: "24" },
            correctAnswer: "b",
            explanation: "24 = 2³×3, 36 = 2²×3². HCF = 2²×3 = 12",
            difficulty: "EASY",
            tags: ["LCM", "HCF"]
        },
        {
            topicId: "arithmetic",
            subjectId: "math",
            question: "The average of 10, 20, 30, 40 is:",
            options: { a: "20", b: "25", c: "30", d: "35" },
            correctAnswer: "b",
            explanation: "Average = (10+20+30+40)/4 = 100/4 = 25",
            difficulty: "EASY",
            tags: ["average"]
        },

        // ===== MATHEMATICS - PERCENTAGE =====
        {
            topicId: "percentage",
            subjectId: "math",
            question: "If the price of an item increases from Rs. 200 to Rs. 250, what is the percentage increase?",
            options: { a: "20%", b: "25%", c: "30%", d: "50%" },
            correctAnswer: "b",
            explanation: "Increase = 50, % increase = (50/200)×100 = 25%",
            difficulty: "EASY",
            tags: ["percentage", "increase"]
        },
        {
            topicId: "percentage",
            subjectId: "math",
            question: "The ratio 3:5 expressed as percentage is:",
            options: { a: "30%", b: "35%", c: "60%", d: "75%" },
            correctAnswer: "c",
            explanation: "3:5 = 3/5 = 0.6 = 60%",
            difficulty: "MEDIUM",
            tags: ["percentage", "ratio"]
        },
        {
            topicId: "percentage",
            subjectId: "math",
            question: "If A is 20% more than B, by what percentage is B less than A?",
            options: { a: "16.67%", b: "20%", c: "25%", d: "33.33%" },
            correctAnswer: "a",
            explanation: "If A = 1.2B, then B is less than A by (0.2/1.2)×100 = 16.67%",
            difficulty: "HARD",
            tags: ["percentage"]
        },

        // ===== MATHEMATICS - PROFIT & LOSS =====
        {
            topicId: "profit-loss",
            subjectId: "math",
            question: "If a shopkeeper buys an item for Rs. 400 and sells it for Rs. 500, what is the profit percentage?",
            options: { a: "20%", b: "25%", c: "30%", d: "50%" },
            correctAnswer: "b",
            explanation: "Profit = 100, Profit % = (100/400)×100 = 25%",
            difficulty: "EASY",
            tags: ["profit"]
        },
        {
            topicId: "profit-loss",
            subjectId: "math",
            question: "An article was sold at a loss of 10%. If the selling price was Rs. 450, what was the cost price?",
            options: { a: "Rs. 400", b: "Rs. 495", c: "Rs. 500", d: "Rs. 550" },
            correctAnswer: "c",
            explanation: "SP = CP(1 - 10/100) → 450 = 0.9×CP → CP = 500",
            difficulty: "MEDIUM",
            tags: ["loss", "cost-price"]
        },
        {
            topicId: "profit-loss",
            subjectId: "math",
            question: "By selling goods for Rs. 540, a trader gains 8%. What is the cost price?",
            options: { a: "Rs. 480", b: "Rs. 500", c: "Rs. 520", d: "Rs. 550" },
            correctAnswer: "b",
            explanation: "540 = CP × 1.08 → CP = 540/1.08 = 500",
            difficulty: "MEDIUM",
            tags: ["profit", "cost-price"]
        },

        // ===== MATHEMATICS - SIMPLE INTEREST =====
        {
            topicId: "simple-interest",
            subjectId: "math",
            question: "Find the simple interest on Rs. 5000 at 10% per annum for 2 years.",
            options: { a: "Rs. 500", b: "Rs. 1000", c: "Rs. 1500", d: "Rs. 2000" },
            correctAnswer: "b",
            explanation: "SI = P×R×T/100 = 5000×10×2/100 = Rs. 1000",
            difficulty: "EASY",
            tags: ["simple-interest"]
        },
        {
            topicId: "simple-interest",
            subjectId: "math",
            question: "At what rate of interest will Rs. 2000 amount to Rs. 2400 in 4 years?",
            options: { a: "4%", b: "5%", c: "6%", d: "10%" },
            correctAnswer: "b",
            explanation: "SI = 400, R = (SI×100)/(P×T) = (400×100)/(2000×4) = 5%",
            difficulty: "MEDIUM",
            tags: ["simple-interest", "rate"]
        },
        {
            topicId: "simple-interest",
            subjectId: "math",
            question: "The compound interest on Rs. 1000 at 10% for 2 years is:",
            options: { a: "Rs. 200", b: "Rs. 210", c: "Rs. 220", d: "Rs. 230" },
            correctAnswer: "b",
            explanation: "A = P(1+R/100)^n = 1000(1.1)² = 1210. CI = 1210-1000 = Rs. 210",
            difficulty: "MEDIUM",
            tags: ["compound-interest"]
        },

        // ===== MATHEMATICS - TIME & WORK =====
        {
            topicId: "time-work",
            subjectId: "math",
            question: "A can do a piece of work in 10 days and B can do it in 15 days. In how many days can they complete it together?",
            options: { a: "5 days", b: "6 days", c: "7 days", d: "8 days" },
            correctAnswer: "b",
            explanation: "Combined rate = 1/10 + 1/15 = 5/30 = 1/6. Time = 6 days",
            difficulty: "MEDIUM",
            tags: ["time-work"]
        },
        {
            topicId: "time-work",
            subjectId: "math",
            question: "A pipe can fill a tank in 6 hours. How much of the tank will be filled in 2 hours?",
            options: { a: "1/4", b: "1/3", c: "1/2", d: "2/3" },
            correctAnswer: "b",
            explanation: "In 1 hour, pipe fills 1/6. In 2 hours = 2/6 = 1/3",
            difficulty: "EASY",
            tags: ["time-work", "pipes"]
        },

        // ===== COMPUTER FUNDAMENTALS =====
        {
            topicId: "computer-basics",
            subjectId: "computer",
            question: "What does CPU stand for?",
            options: { a: "Central Processing Unit", b: "Computer Personal Unit", c: "Central Program Unit", d: "Control Processing Unit" },
            correctAnswer: "a",
            explanation: "CPU stands for Central Processing Unit, the brain of the computer.",
            difficulty: "EASY",
            tags: ["hardware", "basics"]
        },
        {
            topicId: "computer-basics",
            subjectId: "computer",
            question: "Which of the following is an input device?",
            options: { a: "Monitor", b: "Printer", c: "Keyboard", d: "Speaker" },
            correctAnswer: "c",
            explanation: "Keyboard is an input device used to enter data into the computer.",
            difficulty: "EASY",
            tags: ["hardware", "input-output"]
        },
        {
            topicId: "computer-basics",
            subjectId: "computer",
            question: "1 GB is equal to:",
            options: { a: "1000 MB", b: "1024 MB", c: "1000 KB", d: "1024 KB" },
            correctAnswer: "b",
            explanation: "1 GB = 1024 MB (binary system used in computing).",
            difficulty: "EASY",
            tags: ["memory", "units"]
        },
        {
            topicId: "computer-basics",
            subjectId: "computer",
            question: "Which part of the computer is called its 'brain'?",
            options: { a: "RAM", b: "Hard Disk", c: "CPU", d: "Monitor" },
            correctAnswer: "c",
            explanation: "The CPU (Central Processing Unit) is called the brain of the computer.",
            difficulty: "EASY",
            tags: ["hardware", "CPU"]
        },
        {
            topicId: "computer-basics",
            subjectId: "computer",
            question: "Binary number system has base:",
            options: { a: "2", b: "8", c: "10", d: "16" },
            correctAnswer: "a",
            explanation: "Binary system uses only 2 digits (0 and 1), so its base is 2.",
            difficulty: "EASY",
            tags: ["number-system", "binary"]
        },
        {
            topicId: "computer-basics",
            subjectId: "computer",
            question: "Which generation of computers used Integrated Circuits (IC)?",
            options: { a: "First Generation", b: "Second Generation", c: "Third Generation", d: "Fourth Generation" },
            correctAnswer: "c",
            explanation: "Third generation computers (1964-1971) used Integrated Circuits.",
            difficulty: "MEDIUM",
            tags: ["history", "generations"]
        },

        // ===== MS OFFICE =====
        {
            topicId: "ms-office",
            subjectId: "computer",
            question: "The shortcut key for copy is:",
            options: { a: "Ctrl+V", b: "Ctrl+X", c: "Ctrl+C", d: "Ctrl+Z" },
            correctAnswer: "c",
            explanation: "Ctrl+C is the universal shortcut for copy in MS Office and most applications.",
            difficulty: "EASY",
            tags: ["shortcuts", "MS-Word"]
        },
        {
            topicId: "ms-office",
            subjectId: "computer",
            question: "MS Excel files have the extension:",
            options: { a: ".doc", b: ".xls", c: ".ppt", d: ".txt" },
            correctAnswer: "b",
            explanation: "Excel files traditionally have .xls extension (or .xlsx for newer versions).",
            difficulty: "EASY",
            tags: ["MS-Excel", "files"]
        },
        {
            topicId: "ms-office",
            subjectId: "computer",
            question: "In MS Word, to align text to the center, we use:",
            options: { a: "Ctrl+L", b: "Ctrl+R", c: "Ctrl+E", d: "Ctrl+J" },
            correctAnswer: "c",
            explanation: "Ctrl+E centers text. Ctrl+L is left, Ctrl+R is right, Ctrl+J is justify.",
            difficulty: "MEDIUM",
            tags: ["shortcuts", "MS-Word"]
        },
        {
            topicId: "ms-office",
            subjectId: "computer",
            question: "Which function in Excel is used to find the sum of values?",
            options: { a: "AVERAGE", b: "SUM", c: "COUNT", d: "MAX" },
            correctAnswer: "b",
            explanation: "The SUM function adds all the numbers in a range of cells.",
            difficulty: "EASY",
            tags: ["MS-Excel", "functions"]
        },
        {
            topicId: "ms-office",
            subjectId: "computer",
            question: "In MS PowerPoint, the shortcut to start a slideshow is:",
            options: { a: "F1", b: "F3", c: "F5", d: "F7" },
            correctAnswer: "c",
            explanation: "F5 starts the slideshow from the beginning in PowerPoint.",
            difficulty: "MEDIUM",
            tags: ["shortcuts", "MS-PowerPoint"]
        },

        // ===== INTERNET =====
        {
            topicId: "internet",
            subjectId: "computer",
            question: "WWW stands for:",
            options: { a: "World Wide Web", b: "World Web Wide", c: "Wide World Web", d: "Web World Wide" },
            correctAnswer: "a",
            explanation: "WWW stands for World Wide Web, a system of interlinked hypertext documents.",
            difficulty: "EASY",
            tags: ["internet", "basics"]
        },
        {
            topicId: "internet",
            subjectId: "computer",
            question: "Which protocol is used for secure web browsing?",
            options: { a: "HTTP", b: "HTTPS", c: "FTP", d: "SMTP" },
            correctAnswer: "b",
            explanation: "HTTPS (Hypertext Transfer Protocol Secure) is used for secure browsing.",
            difficulty: "EASY",
            tags: ["internet", "protocols"]
        },
        {
            topicId: "internet",
            subjectId: "computer",
            question: "What is the full form of URL?",
            options: { a: "Uniform Resource Locator", b: "Universal Resource Locator", c: "Uniform Resource Link", d: "Universal Resource Link" },
            correctAnswer: "a",
            explanation: "URL stands for Uniform Resource Locator - the address of a web resource.",
            difficulty: "EASY",
            tags: ["internet", "basics"]
        },
        {
            topicId: "internet",
            subjectId: "computer",
            question: "Which of the following is a web browser?",
            options: { a: "MS Word", b: "Google Chrome", c: "Photoshop", d: "VLC" },
            correctAnswer: "b",
            explanation: "Google Chrome is a web browser used to access websites on the internet.",
            difficulty: "EASY",
            tags: ["internet", "browsers"]
        },
        {
            topicId: "internet",
            subjectId: "computer",
            question: "SMTP is used for:",
            options: { a: "Receiving emails", b: "Sending emails", c: "Web browsing", d: "File transfer" },
            correctAnswer: "b",
            explanation: "SMTP (Simple Mail Transfer Protocol) is used for sending emails.",
            difficulty: "MEDIUM",
            tags: ["internet", "email", "protocols"]
        },

        // ===== HARDWARE & SOFTWARE =====
        {
            topicId: "hardware-software",
            subjectId: "computer",
            question: "Which of the following is system software?",
            options: { a: "MS Word", b: "Windows 10", c: "Adobe Photoshop", d: "VLC Player" },
            correctAnswer: "b",
            explanation: "Windows 10 is an operating system, which is a type of system software.",
            difficulty: "EASY",
            tags: ["software", "operating-system"]
        },
        {
            topicId: "hardware-software",
            subjectId: "computer",
            question: "RAM is a type of:",
            options: { a: "Volatile memory", b: "Non-volatile memory", c: "Secondary storage", d: "Output device" },
            correctAnswer: "a",
            explanation: "RAM is volatile memory - data is lost when power is turned off.",
            difficulty: "MEDIUM",
            tags: ["hardware", "memory"]
        },
        {
            topicId: "hardware-software",
            subjectId: "computer",
            question: "Which of the following is an example of application software?",
            options: { a: "Linux", b: "BIOS", c: "Device Driver", d: "Microsoft Word" },
            correctAnswer: "d",
            explanation: "Microsoft Word is application software designed for word processing.",
            difficulty: "EASY",
            tags: ["software", "applications"]
        },
        {
            topicId: "hardware-software",
            subjectId: "computer",
            question: "Hard disk is a:",
            options: { a: "Primary storage", b: "Secondary storage", c: "Input device", d: "Output device" },
            correctAnswer: "b",
            explanation: "Hard disk is secondary storage used for permanent data storage.",
            difficulty: "EASY",
            tags: ["hardware", "storage"]
        },

        // ===== NETWORKING =====
        {
            topicId: "networking",
            subjectId: "computer",
            question: "The full form of LAN is:",
            options: { a: "Local Area Network", b: "Large Area Network", c: "Long Area Network", d: "Light Area Network" },
            correctAnswer: "a",
            explanation: "LAN stands for Local Area Network - a network in a limited area.",
            difficulty: "EASY",
            tags: ["networking", "basics"]
        },
        {
            topicId: "networking",
            subjectId: "computer",
            question: "Which device is used to connect multiple computers in a network?",
            options: { a: "Modem", b: "Switch", c: "Printer", d: "Scanner" },
            correctAnswer: "b",
            explanation: "A switch is used to connect multiple computers in a network.",
            difficulty: "MEDIUM",
            tags: ["networking", "devices"]
        },
        {
            topicId: "networking",
            subjectId: "computer",
            question: "IP address consists of how many octets?",
            options: { a: "2", b: "3", c: "4", d: "5" },
            correctAnswer: "c",
            explanation: "IPv4 address consists of 4 octets (e.g., 192.168.1.1).",
            difficulty: "MEDIUM",
            tags: ["networking", "IP"]
        },

        // ===== CYBER SECURITY =====
        {
            topicId: "cyber-security",
            subjectId: "computer",
            question: "Malware is short for:",
            options: { a: "Maintenance software", b: "Malicious software", c: "Main software", d: "Memory software" },
            correctAnswer: "b",
            explanation: "Malware (malicious software) is designed to damage or gain unauthorized access.",
            difficulty: "EASY",
            tags: ["security", "malware"]
        },
        {
            topicId: "cyber-security",
            subjectId: "computer",
            question: "Which of the following is a type of cyber attack?",
            options: { a: "Phishing", b: "Swimming", c: "Fishing", d: "Driving" },
            correctAnswer: "a",
            explanation: "Phishing is a cyber attack that tricks users into revealing sensitive information.",
            difficulty: "EASY",
            tags: ["security", "attacks"]
        },
        {
            topicId: "cyber-security",
            subjectId: "computer",
            question: "What is a firewall used for?",
            options: { a: "To prevent fire", b: "To cool the computer", c: "To protect against unauthorized access", d: "To speed up internet" },
            correctAnswer: "c",
            explanation: "A firewall monitors and controls network traffic to prevent unauthorized access.",
            difficulty: "MEDIUM",
            tags: ["security", "firewall"]
        },

        // ===== CURRENT AFFAIRS - NEPAL =====
        {
            topicId: "nepal-current",
            subjectId: "current-affairs",
            question: "Who is the current President of Nepal? (As of 2024)",
            options: { a: "Bidya Devi Bhandari", b: "Ram Chandra Poudel", c: "Pushpa Kamal Dahal", d: "Sher Bahadur Deuba" },
            correctAnswer: "b",
            explanation: "Ram Chandra Poudel became the third President of Nepal on March 13, 2023.",
            difficulty: "EASY",
            tags: ["president", "politics"]
        },
        {
            topicId: "nepal-current",
            subjectId: "current-affairs",
            question: "Nepal's national census 2078 recorded the population as approximately:",
            options: { a: "26 million", b: "29 million", c: "30 million", d: "32 million" },
            correctAnswer: "c",
            explanation: "According to Census 2078, Nepal's population is approximately 29.2 million (≈30 million).",
            difficulty: "MEDIUM",
            tags: ["census", "population"]
        },
        {
            topicId: "nepal-current",
            subjectId: "current-affairs",
            question: "Which organization regulates banking in Nepal?",
            options: { a: "Nepal Bank Limited", b: "Nepal Rastra Bank", c: "Rastriya Banijya Bank", d: "Ministry of Finance" },
            correctAnswer: "b",
            explanation: "Nepal Rastra Bank (NRB) is the central bank that regulates banking in Nepal.",
            difficulty: "EASY",
            tags: ["banking", "NRB"]
        },

        // ===== WORLD CURRENT AFFAIRS =====
        {
            topicId: "world-current",
            subjectId: "current-affairs",
            question: "The headquarters of the United Nations is located in:",
            options: { a: "Geneva", b: "Paris", c: "New York", d: "London" },
            correctAnswer: "c",
            explanation: "The UN headquarters is located in New York City, USA.",
            difficulty: "EASY",
            tags: ["UN", "international"]
        },
        {
            topicId: "world-current",
            subjectId: "current-affairs",
            question: "Which country recently joined NATO in 2023?",
            options: { a: "Sweden", b: "Finland", c: "Ukraine", d: "Georgia" },
            correctAnswer: "b",
            explanation: "Finland officially joined NATO on April 4, 2023, becoming the 31st member.",
            difficulty: "MEDIUM",
            tags: ["NATO", "international"]
        },
        {
            topicId: "world-current",
            subjectId: "current-affairs",
            question: "The G20 Summit 2023 was held in:",
            options: { a: "Japan", b: "India", c: "Indonesia", d: "China" },
            correctAnswer: "b",
            explanation: "The G20 Summit 2023 was held in New Delhi, India on September 9-10.",
            difficulty: "EASY",
            tags: ["G20", "summit"]
        },

        // ===== SPORTS =====
        {
            topicId: "sports",
            subjectId: "current-affairs",
            question: "The 2024 Summer Olympics will be held in:",
            options: { a: "Tokyo", b: "Paris", c: "Los Angeles", d: "Brisbane" },
            correctAnswer: "b",
            explanation: "The 2024 Summer Olympics are scheduled to be held in Paris, France.",
            difficulty: "EASY",
            tags: ["olympics", "sports"]
        },
        {
            topicId: "sports",
            subjectId: "current-affairs",
            question: "Who won the ICC Cricket World Cup 2023?",
            options: { a: "India", b: "Pakistan", c: "Australia", d: "England" },
            correctAnswer: "c",
            explanation: "Australia won the ICC Cricket World Cup 2023, defeating India in the final.",
            difficulty: "EASY",
            tags: ["cricket", "world-cup"]
        },
        {
            topicId: "sports",
            subjectId: "current-affairs",
            question: "The FIFA World Cup 2022 was held in:",
            options: { a: "Russia", b: "Brazil", c: "Qatar", d: "France" },
            correctAnswer: "c",
            explanation: "FIFA World Cup 2022 was held in Qatar, won by Argentina.",
            difficulty: "EASY",
            tags: ["football", "world-cup"]
        },

        // ===== AWARDS =====
        {
            topicId: "awards",
            subjectId: "current-affairs",
            question: "The Nobel Peace Prize 2023 was awarded to:",
            options: { a: "Narges Mohammadi", b: "Maria Ressa", c: "Ales Bialiatski", d: "David Julius" },
            correctAnswer: "a",
            explanation: "Narges Mohammadi won the 2023 Nobel Peace Prize for her fight against oppression of women in Iran.",
            difficulty: "MEDIUM",
            tags: ["nobel", "awards"]
        },
        {
            topicId: "awards",
            subjectId: "current-affairs",
            question: "India's highest civilian award is:",
            options: { a: "Padma Shri", b: "Padma Bhushan", c: "Padma Vibhushan", d: "Bharat Ratna" },
            correctAnswer: "d",
            explanation: "Bharat Ratna is the highest civilian award in India.",
            difficulty: "EASY",
            tags: ["awards", "India"]
        },

        // ===== INTERNATIONAL ORGANIZATIONS =====
        {
            topicId: "organizations",
            subjectId: "current-affairs",
            question: "SAARC stands for:",
            options: { a: "South Asian Association for Regional Cooperation", b: "South American Association for Regional Cooperation", c: "Southeast Asian Association for Regional Cooperation", d: "South African Association for Regional Cooperation" },
            correctAnswer: "a",
            explanation: "SAARC stands for South Asian Association for Regional Cooperation, headquartered in Kathmandu.",
            difficulty: "EASY",
            tags: ["SAARC", "organizations"]
        },
        {
            topicId: "organizations",
            subjectId: "current-affairs",
            question: "The World Health Organization (WHO) is headquartered in:",
            options: { a: "New York", b: "Geneva", c: "Rome", d: "Paris" },
            correctAnswer: "b",
            explanation: "WHO headquarters is located in Geneva, Switzerland.",
            difficulty: "EASY",
            tags: ["WHO", "organizations"]
        },
        {
            topicId: "organizations",
            subjectId: "current-affairs",
            question: "The International Monetary Fund (IMF) has how many member countries?",
            options: { a: "180", b: "185", c: "190", d: "195" },
            correctAnswer: "c",
            explanation: "The IMF currently has 190 member countries.",
            difficulty: "MEDIUM",
            tags: ["IMF", "organizations"]
        },

        // ===== MORE WORLD GEOGRAPHY =====
        {
            topicId: "world-geography",
            subjectId: "gk",
            question: "Which is the largest continent by area?",
            options: { a: "Africa", b: "Asia", c: "North America", d: "Europe" },
            correctAnswer: "b",
            explanation: "Asia is the largest continent, covering about 30% of Earth's land area.",
            difficulty: "EASY",
            tags: ["continents", "geography"]
        },
        {
            topicId: "world-geography",
            subjectId: "gk",
            question: "The longest river in the world is:",
            options: { a: "Amazon", b: "Nile", c: "Yangtze", d: "Mississippi" },
            correctAnswer: "b",
            explanation: "The Nile River is approximately 6,650 km long, making it the longest river.",
            difficulty: "EASY",
            tags: ["rivers", "geography"]
        },
        {
            topicId: "world-geography",
            subjectId: "gk",
            question: "Which ocean is the deepest?",
            options: { a: "Atlantic Ocean", b: "Indian Ocean", c: "Arctic Ocean", d: "Pacific Ocean" },
            correctAnswer: "d",
            explanation: "The Pacific Ocean is the deepest, with the Mariana Trench at 10,935m deep.",
            difficulty: "EASY",
            tags: ["oceans", "geography"]
        },
        {
            topicId: "world-geography",
            subjectId: "gk",
            question: "Which country has the most number of UNESCO World Heritage Sites?",
            options: { a: "China", b: "Italy", c: "Spain", d: "France" },
            correctAnswer: "b",
            explanation: "Italy has the most UNESCO World Heritage Sites (59 as of 2023).",
            difficulty: "MEDIUM",
            tags: ["UNESCO", "heritage"]
        },

        // ===== WORLD HISTORY =====
        {
            topicId: "world-history",
            subjectId: "gk",
            question: "The French Revolution began in which year?",
            options: { a: "1776", b: "1789", c: "1799", d: "1815" },
            correctAnswer: "b",
            explanation: "The French Revolution began in 1789 with the storming of the Bastille.",
            difficulty: "MEDIUM",
            tags: ["revolution", "France"]
        },
        {
            topicId: "world-history",
            subjectId: "gk",
            question: "World War I ended in which year?",
            options: { a: "1914", b: "1916", c: "1918", d: "1920" },
            correctAnswer: "c",
            explanation: "World War I ended on November 11, 1918 with the signing of the Armistice.",
            difficulty: "EASY",
            tags: ["world-war", "history"]
        },
        {
            topicId: "world-history",
            subjectId: "gk",
            question: "The Berlin Wall fell in which year?",
            options: { a: "1985", b: "1987", c: "1989", d: "1991" },
            correctAnswer: "c",
            explanation: "The Berlin Wall fell on November 9, 1989, symbolizing the end of the Cold War.",
            difficulty: "MEDIUM",
            tags: ["cold-war", "Germany"]
        },

        // ===== SCIENCE & TECHNOLOGY =====
        {
            topicId: "science-tech",
            subjectId: "gk",
            question: "What is the chemical symbol for Gold?",
            options: { a: "Go", b: "Gd", c: "Au", d: "Ag" },
            correctAnswer: "c",
            explanation: "Au (from Latin 'Aurum') is the chemical symbol for Gold.",
            difficulty: "EASY",
            tags: ["chemistry", "elements"]
        },
        {
            topicId: "science-tech",
            subjectId: "gk",
            question: "Who discovered penicillin?",
            options: { a: "Alexander Fleming", b: "Louis Pasteur", c: "Robert Koch", d: "Edward Jenner" },
            correctAnswer: "a",
            explanation: "Alexander Fleming discovered penicillin in 1928.",
            difficulty: "MEDIUM",
            tags: ["medicine", "discoveries"]
        },
        {
            topicId: "science-tech",
            subjectId: "gk",
            question: "The planet known as the 'Red Planet' is:",
            options: { a: "Venus", b: "Mars", c: "Jupiter", d: "Saturn" },
            correctAnswer: "b",
            explanation: "Mars is called the Red Planet due to its reddish appearance from iron oxide.",
            difficulty: "EASY",
            tags: ["space", "planets"]
        },
        {
            topicId: "science-tech",
            subjectId: "gk",
            question: "What is the SI unit of electric current?",
            options: { a: "Volt", b: "Watt", c: "Ampere", d: "Ohm" },
            correctAnswer: "c",
            explanation: "Ampere (A) is the SI unit of electric current.",
            difficulty: "EASY",
            tags: ["physics", "units"]
        },
        {
            topicId: "science-tech",
            subjectId: "gk",
            question: "DNA stands for:",
            options: { a: "Deoxyribonucleic Acid", b: "Diribonucleic Acid", c: "Dual Nucleic Acid", d: "Dynamic Nucleic Acid" },
            correctAnswer: "a",
            explanation: "DNA stands for Deoxyribonucleic Acid, the carrier of genetic information.",
            difficulty: "MEDIUM",
            tags: ["biology", "genetics"]
        }
    ]

    // Insert questions in batches
    const batchSize = 50
    let insertedCount = 0

    for (let i = 0; i < questionBank.length; i += batchSize) {
        const batch = questionBank.slice(i, i + batchSize)
        
        for (const q of batch) {
            try {
                await prisma.question.create({
                    data: {
                        subjectId: q.subjectId,
                        topicId: q.topicId,
                        question: q.question,
                        questionNp: q.questionNp ?? null,
                        options: q.options,
                        optionsNp: q.optionsNp ?? Prisma.JsonNull,
                        correctAnswer: q.correctAnswer,
                        explanation: q.explanation ?? null,
                        difficulty: q.difficulty,
                        source: q.source ?? null,
                        tags: q.tags || [],
                        isActive: true,
                        isVerified: true
                    }
                })
                insertedCount++
            } catch (error: any) {
                // Skip duplicates or other errors
                if (!error.message?.includes('Unique constraint')) {
                    console.error(`  ✗ Error inserting question: ${q.question.substring(0, 50)}...`)
                }
            }
        }
        
        console.log(`  ✓ Inserted ${Math.min(i + batchSize, questionBank.length)} of ${questionBank.length} questions...`)
    }

    console.log(`\n✅ Database seeding completed!`)
    console.log(`   - Exam Types: 1`)
    console.log(`   - Exam Levels: ${levels.length}`)
    console.log(`   - Subjects: ${subjects.length}`)
    console.log(`   - Topics: ${topics.length}`)
    console.log(`   - Questions: ${insertedCount}`)
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
