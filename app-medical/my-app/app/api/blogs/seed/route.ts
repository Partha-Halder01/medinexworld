import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const DUMMY_BLOGS = [
  {
    title: '7 Daily Habits for Better Heart Health',
    titleHi: 'बेहतर हृदय स्वास्थ्य के लिए 7 दैनिक आदतें',
    slug: 'daily-habits-better-heart-health',
    content:
      'Heart health improves with small, consistent habits. Start with 30 minutes of brisk walking, reduce salt intake, avoid processed snacks, and prioritize deep sleep. Add stress management through breathing exercises and stay hydrated through the day. Schedule annual blood pressure and lipid profile checks for early risk detection.',
    contentHi:
      'हृदय स्वास्थ्य छोटे लेकिन नियमित बदलावों से बेहतर होता है। रोज 30 मिनट तेज चलना, नमक कम करना, प्रोसेस्ड स्नैक्स से बचना और अच्छी नींद लेना जरूरी है। स्ट्रेस कम करने के लिए श्वास अभ्यास करें और दिनभर पर्याप्त पानी पिएं। साल में एक बार ब्लड प्रेशर और लिपिड प्रोफाइल जांच जरूर कराएं।',
    excerpt: 'Simple daily habits that significantly reduce your long-term heart disease risk.',
    excerptHi: 'रोजमर्रा की आसान आदतें जो हृदय रोग का जोखिम कम करती हैं।',
    coverImage: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80',
    author: 'Medinex World Editorial',
    tags: ['heart', 'prevention', 'fitness'],
    category: 'health-tips',
    isPublished: true,
  },
  {
    title: 'Understanding Early Diabetes Warning Signs',
    titleHi: 'मधुमेह के शुरुआती संकेतों को समझें',
    slug: 'early-diabetes-warning-signs',
    content:
      'Early diabetes symptoms can be subtle. Frequent urination, unusual thirst, slow wound healing, fatigue, and blurred vision should not be ignored. If you have a family history or sedentary lifestyle, get fasting glucose and HbA1c tests every 6-12 months. Lifestyle correction in early stages can delay complications.',
    contentHi:
      'मधुमेह के शुरुआती लक्षण अक्सर हल्के होते हैं। बार-बार पेशाब आना, ज्यादा प्यास लगना, घाव देर से भरना, थकान और धुंधला दिखना नजरअंदाज न करें। परिवार में इतिहास होने पर 6-12 महीने में फास्टिंग शुगर और HbA1c जांच कराएं। शुरुआती चरण में जीवनशैली सुधार से जटिलताएं टल सकती हैं।',
    excerpt: 'Know when mild symptoms could be the first hint of diabetes.',
    excerptHi: 'जानिए कब सामान्य लगने वाले लक्षण मधुमेह का संकेत हो सकते हैं।',
    coverImage: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80',
    author: 'Medinex World Editorial',
    tags: ['diabetes', 'screening', 'sugar'],
    category: 'disease-info',
    isPublished: true,
  },
  {
    title: 'Monsoon Immunity Guide: Foods That Help',
    titleHi: 'मानसून इम्युनिटी गाइड: कौन से भोजन लाभकारी हैं',
    slug: 'monsoon-immunity-food-guide',
    content:
      'During monsoon, immunity support is essential. Include vitamin C rich fruits, turmeric milk, ginger tea, seasonal vegetables, and protein-rich meals. Avoid stale street food and prioritize freshly cooked warm meals. Hand hygiene and safe drinking water are equally important to prevent seasonal infections.',
    contentHi:
      'मानसून में रोग प्रतिरोधक क्षमता बढ़ाना जरूरी है। विटामिन C वाले फल, हल्दी वाला दूध, अदरक चाय, मौसमी सब्जियां और प्रोटीन युक्त भोजन लें। बासी स्ट्रीट फूड से बचें और ताजा गर्म भोजन को प्राथमिकता दें। मौसमी संक्रमण से बचाव के लिए हाथों की सफाई और सुरक्षित पानी भी उतना ही जरूरी है।',
    excerpt: 'Nutrition checklist to stay protected from common monsoon infections.',
    excerptHi: 'मानसून संक्रमण से बचाव के लिए पोषण संबंधी आसान चेकलिस्ट।',
    coverImage: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
    author: 'Medinex World Editorial',
    tags: ['immunity', 'nutrition', 'monsoon'],
    category: 'nutrition',
    isPublished: true,
  },
  {
    title: 'How to Build a Stress-Relief Routine in 15 Minutes',
    titleHi: '15 मिनट में तनाव कम करने की दिनचर्या कैसे बनाएं',
    slug: 'build-stress-relief-routine-15-minutes',
    content:
      'A short stress routine can improve mood and concentration. Spend 5 minutes on slow breathing, 5 minutes on light stretching, and 5 minutes on journaling gratitude. Keep your phone away during this window. Repeating this daily helps reduce cortisol levels and supports better sleep quality.',
    contentHi:
      'छोटी तनाव-राहत दिनचर्या मूड और एकाग्रता बेहतर करती है। 5 मिनट धीमी सांस, 5 मिनट हल्की स्ट्रेचिंग और 5 मिनट कृतज्ञता लेखन करें। इस समय फोन दूर रखें। रोज ऐसा करने से कोर्टिसोल कम होता है और नींद की गुणवत्ता बेहतर होती है।',
    excerpt: 'A practical 15-minute routine for better mental wellness every day.',
    excerptHi: 'हर दिन मानसिक स्वास्थ्य बेहतर करने के लिए 15 मिनट की व्यावहारिक दिनचर्या।',
    coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    author: 'Medinex World Editorial',
    tags: ['wellness', 'stress', 'sleep'],
    category: 'wellness',
    isPublished: true,
  },
  {
    title: 'Health News: Why Regular Preventive Checkups Matter',
    titleHi: 'हेल्थ न्यूज़: नियमित प्रिवेंटिव चेकअप क्यों जरूरी हैं',
    slug: 'health-news-preventive-checkups-matter',
    content:
      'Preventive checkups help detect hidden conditions before symptoms appear. Regular blood tests, blood pressure monitoring, and age-specific screenings can reduce emergency health events. Experts recommend annual preventive plans tailored by age, medical history, and current lifestyle risk factors.',
    contentHi:
      'प्रिवेंटिव चेकअप से कई बीमारियों का पता लक्षण आने से पहले लग सकता है। नियमित ब्लड टेस्ट, ब्लड प्रेशर मॉनिटरिंग और उम्र के अनुसार स्क्रीनिंग से आपात स्थितियों का जोखिम घटता है। विशेषज्ञ उम्र, मेडिकल इतिहास और जीवनशैली के आधार पर वार्षिक जांच योजना की सलाह देते हैं।',
    excerpt: 'Experts highlight why preventive health checkups should be non-negotiable.',
    excerptHi: 'विशेषज्ञ बताते हैं कि नियमित प्रिवेंटिव चेकअप क्यों अनिवार्य होने चाहिए।',
    coverImage: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80',
    author: 'Medinex World Editorial',
    tags: ['news', 'checkup', 'prevention'],
    category: 'news',
    isPublished: true,
  },
];

export async function POST() {
  try {
    let inserted = 0;
    for (const blog of DUMMY_BLOGS) {
      await prisma.blog.upsert({
        where: { slug: blog.slug },
        update: {},
        create: {
          ...blog,
          publishedAt: blog.isPublished ? new Date() : null,
        },
      });
      inserted++;
    }

    return NextResponse.json({
      message: 'Dummy blogs processed successfully.',
      inserted,
      total: DUMMY_BLOGS.length,
    });
  } catch (error: unknown) {
    console.error('Seed blogs error:', error);
    const message = error instanceof Error ? error.message : 'Failed to seed dummy blogs.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
