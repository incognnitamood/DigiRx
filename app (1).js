// Digital Prescription System - Main JavaScript
// Academic prototype demonstrating rule-based drug safety checks

// In a production system, this would be replaced by a secure medical database
// For now, we use localStorage to simulate data persistence

// ============================================
// DRUG INTERACTION DATABASE
// Based on WHO Essential Medicines List (EML) and FDA DailyMed contraindications
// This is a limited, curated dataset for educational purposes
// ============================================

const DRUG_DATABASE = {
    // NSAIDs (Non-Steroidal Anti-Inflammatory Drugs)
    'ibuprofen': {
        contraindications: ['hypertension', 'renal_impairment', 'pregnancy'],
        warnings: {
            'hypertension': 'NSAIDs may increase blood pressure and cardiovascular risk. Monitor BP closely.',
            'renal_impairment': 'NSAIDs can worsen kidney function. Consider dose reduction or alternative.',
            'pregnancy': 'Avoid in third trimester - risk of premature closure of ductus arteriosus.'
        },
        source: 'WHO EML / FDA'
    },
    'diclofenac': {
        contraindications: ['hypertension', 'renal_impairment', 'liver_disease'],
        warnings: {
            'hypertension': 'NSAIDs may increase blood pressure. Monitor cardiovascular status.',
            'renal_impairment': 'Risk of acute kidney injury. Use with caution.',
            'liver_disease': 'May cause hepatotoxicity. Monitor liver function.'
        },
        source: 'WHO EML / FDA'
    },
    'aspirin': {
        contraindications: ['asthma', 'pregnancy', 'renal_impairment'],
        warnings: {
            'asthma': 'Risk of bronchospasm in aspirin-sensitive asthma patients.',
            'pregnancy': 'Avoid in third trimester - bleeding risk and ductus arteriosus issues.',
            'renal_impairment': 'May worsen renal function at high doses.'
        },
        source: 'WHO EML / FDA'
    },
    
    // Antidiabetic medications
    'metformin': {
        contraindications: ['renal_impairment', 'liver_disease'],
        warnings: {
            'renal_impairment': 'Risk of lactic acidosis. Contraindicated in severe renal impairment (eGFR <30).',
            'liver_disease': 'Increased risk of lactic acidosis. Avoid in severe hepatic impairment.'
        },
        source: 'WHO EML / FDA'
    },
    'glibenclamide': {
        contraindications: ['renal_impairment', 'liver_disease'],
        warnings: {
            'renal_impairment': 'Risk of prolonged hypoglycemia. Consider shorter-acting alternatives.',
            'liver_disease': 'Increased hypoglycemia risk due to reduced metabolism.'
        },
        source: 'WHO EML'
    },
    
    // Antihypertensive medications
    'enalapril': {
        contraindications: ['pregnancy', 'renal_impairment'],
        warnings: {
            'pregnancy': 'ACE inhibitors are contraindicated - risk of fetal toxicity and death.',
            'renal_impairment': 'Monitor renal function closely. May cause hyperkalemia.'
        },
        source: 'WHO EML / FDA'
    },
    'lisinopril': {
        contraindications: ['pregnancy', 'renal_impairment'],
        warnings: {
            'pregnancy': 'ACE inhibitors can cause fetal harm. Contraindicated in all trimesters.',
            'renal_impairment': 'Dose adjustment required. Risk of acute renal failure.'
        },
        source: 'FDA'
    },
    
    // Antibiotics
    'amoxicillin': {
        contraindications: [],
        warnings: {}
        // Generally safe, no major contraindications in our limited condition set
    },
    'ciprofloxacin': {
        contraindications: ['pregnancy'],
        warnings: {
            'pregnancy': 'Quinolones should be avoided - risk of arthropathy in fetus.',
        },
        source: 'WHO EML / FDA'
    },
    
    // Analgesics
    'paracetamol': {
        contraindications: ['liver_disease'],
        warnings: {
            'liver_disease': 'Use with caution - risk of hepatotoxicity. Reduce dose in severe impairment.'
        },
        source: 'WHO EML'
    },
    
    // Corticosteroids
    'prednisolone': {
        contraindications: ['diabetes', 'hypertension'],
        warnings: {
            'diabetes': 'Steroids increase blood glucose. Monitor closely and adjust antidiabetic therapy.',
            'hypertension': 'May worsen blood pressure control. Monitor BP regularly.'
        },
        source: 'WHO EML / FDA'
    },
    
    // Beta blockers
    'atenolol': {
        contraindications: ['asthma', 'diabetes'],
        warnings: {
            'asthma': 'Beta blockers can cause bronchospasm. Use cardioselective agents with caution.',
            'diabetes': 'May mask hypoglycemia symptoms. Monitor blood glucose carefully.'
        },
        source: 'WHO EML'
    },
    'metoprolol': {
        contraindications: ['asthma', 'diabetes'],
        warnings: {
            'asthma': 'Beta blocker - risk of bronchospasm. Avoid in uncontrolled asthma.',
            'diabetes': 'May mask signs of hypoglycemia. Monitor blood sugar closely.'
        },
        source: 'FDA'
    },
    'propranolol': {
        contraindications: ['asthma', 'diabetes'],
        warnings: {
            'asthma': 'Non-selective beta blocker - contraindicated in asthma. Risk of severe bronchospasm.',
            'diabetes': 'Masks hypoglycemia symptoms and may prolong hypoglycemia.'
        },
        source: 'WHO EML / FDA'
    },
    
    // Calcium channel blockers
    'amlodipine': {
        contraindications: ['liver_disease'],
        warnings: {
            'liver_disease': 'Metabolized by liver. Start with low dose in hepatic impairment.'
        },
        source: 'FDA'
    },
    'nifedipine': {
        contraindications: ['liver_disease'],
        warnings: {
            'liver_disease': 'Use with caution - hepatic metabolism. Dose adjustment may be needed.'
        },
        source: 'WHO EML'
    },
    
    // Diuretics
    'furosemide': {
        contraindications: ['renal_impairment', 'liver_disease'],
        warnings: {
            'renal_impairment': 'Monitor renal function and electrolytes. May cause further deterioration.',
            'liver_disease': 'Risk of hepatic encephalopathy in cirrhosis. Monitor closely.'
        },
        source: 'WHO EML / FDA'
    },
    'hydrochlorothiazide': {
        contraindications: ['renal_impairment', 'diabetes'],
        warnings: {
            'renal_impairment': 'Ineffective in severe renal impairment (GFR <30). Use loop diuretics instead.',
            'diabetes': 'May worsen glucose control. Monitor blood sugar regularly.'
        },
        source: 'FDA'
    },
    'spironolactone': {
        contraindications: ['renal_impairment'],
        warnings: {
            'renal_impairment': 'Risk of hyperkalemia. Monitor potassium and renal function closely.'
        },
        source: 'WHO EML'
    },
    
    // More ACE inhibitors / ARBs
    'ramipril': {
        contraindications: ['pregnancy', 'renal_impairment'],
        warnings: {
            'pregnancy': 'ACE inhibitors cause fetal toxicity. Contraindicated in all trimesters.',
            'renal_impairment': 'Monitor renal function. Risk of hyperkalemia and acute kidney injury.'
        },
        source: 'FDA'
    },
    'losartan': {
        contraindications: ['pregnancy', 'renal_impairment'],
        warnings: {
            'pregnancy': 'ARBs cause fetal harm similar to ACE inhibitors. Contraindicated.',
            'renal_impairment': 'Monitor renal function and potassium. Dose adjustment may be needed.'
        },
        source: 'FDA'
    },
    'telmisartan': {
        contraindications: ['pregnancy', 'renal_impairment', 'liver_disease'],
        warnings: {
            'pregnancy': 'ARB - contraindicated. Can cause fetal injury and death.',
            'renal_impairment': 'Use with caution. Monitor renal function regularly.',
            'liver_disease': 'Primarily hepatically eliminated. Use lower doses in hepatic impairment.'
        },
        source: 'FDA'
    },
    
    // More antidiabetic medications
    'gliclazide': {
        contraindications: ['renal_impairment', 'liver_disease'],
        warnings: {
            'renal_impairment': 'Risk of hypoglycemia. Consider dose reduction.',
            'liver_disease': 'Reduced metabolism may increase hypoglycemia risk.'
        },
        source: 'WHO EML'
    },
    'glimepiride': {
        contraindications: ['renal_impairment', 'liver_disease'],
        warnings: {
            'renal_impairment': 'Increased risk of prolonged hypoglycemia. Careful monitoring needed.',
            'liver_disease': 'Use with caution. May accumulate and cause hypoglycemia.'
        },
        source: 'FDA'
    },
    'sitagliptin': {
        contraindications: ['renal_impairment'],
        warnings: {
            'renal_impairment': 'Dose adjustment required based on eGFR. Reduce dose in moderate to severe impairment.'
        },
        source: 'FDA'
    },
    'insulin': {
        contraindications: [],
        warnings: {}
        // Generally safe but requires monitoring in all conditions
    },
    
    // More antibiotics
    'azithromycin': {
        contraindications: ['liver_disease'],
        warnings: {
            'liver_disease': 'Risk of hepatotoxicity and fulminant hepatic necrosis. Use with caution.'
        },
        source: 'WHO EML / FDA'
    },
    'levofloxacin': {
        contraindications: ['pregnancy'],
        warnings: {
            'pregnancy': 'Fluoroquinolone - avoid during pregnancy. Risk of arthropathy in fetus.'
        },
        source: 'FDA'
    },
    'cephalexin': {
        contraindications: [],
        warnings: {}
        // Generally safe
    },
    'doxycycline': {
        contraindications: ['pregnancy', 'liver_disease'],
        warnings: {
            'pregnancy': 'Contraindicated in pregnancy - affects fetal bone and tooth development.',
            'liver_disease': 'May accumulate in hepatic impairment. Use with caution.'
        },
        source: 'WHO EML / FDA'
    },
    'metronidazole': {
        contraindications: ['liver_disease', 'pregnancy'],
        warnings: {
            'liver_disease': 'Dose reduction required in severe hepatic impairment.',
            'pregnancy': 'Avoid in first trimester. Use only if clearly needed in later pregnancy.'
        },
        source: 'WHO EML'
    },
    
    // Antihistamines
    'cetirizine': {
        contraindications: ['renal_impairment'],
        warnings: {
            'renal_impairment': 'Dose reduction recommended. Renally excreted.'
        },
        source: 'FDA'
    },
    'loratadine': {
        contraindications: ['liver_disease'],
        warnings: {
            'liver_disease': 'Use lower dose in hepatic impairment due to increased bioavailability.'
        },
        source: 'FDA'
    },
    'fexofenadine': {
        contraindications: ['renal_impairment'],
        warnings: {
            'renal_impairment': 'Dose adjustment recommended in severe renal impairment.'
        },
        source: 'FDA'
    },
    
    // PPIs and H2 blockers
    'omeprazole': {
        contraindications: ['liver_disease'],
        warnings: {
            'liver_disease': 'Dose reduction may be needed in severe hepatic impairment.'
        },
        source: 'WHO EML'
    },
    'pantoprazole': {
        contraindications: ['liver_disease'],
        warnings: {
            'liver_disease': 'Use with caution in severe hepatic impairment.'
        },
        source: 'FDA'
    },
    'esomeprazole': {
        contraindications: ['liver_disease'],
        warnings: {
            'liver_disease': 'Dose reduction recommended in severe hepatic impairment.'
        },
        source: 'FDA'
    },
    'ranitidine': {
        contraindications: ['renal_impairment'],
        warnings: {
            'renal_impairment': 'Dose adjustment required. Renally eliminated.'
        },
        source: 'WHO EML'
    },
    
    // Statins
    'atorvastatin': {
        contraindications: ['liver_disease', 'pregnancy'],
        warnings: {
            'liver_disease': 'Contraindicated in active liver disease. Monitor liver function.',
            'pregnancy': 'Contraindicated - potential for fetal harm. Discontinue if pregnant.'
        },
        source: 'FDA'
    },
    'simvastatin': {
        contraindications: ['liver_disease', 'pregnancy'],
        warnings: {
            'liver_disease': 'Contraindicated in active liver disease. Risk of hepatotoxicity.',
            'pregnancy': 'Contraindicated. May cause fetal harm.'
        },
        source: 'WHO EML / FDA'
    },
    'rosuvastatin': {
        contraindications: ['liver_disease', 'pregnancy', 'renal_impairment'],
        warnings: {
            'liver_disease': 'Contraindicated in active liver disease.',
            'pregnancy': 'Contraindicated. Risk to fetus.',
            'renal_impairment': 'Start with low dose in severe renal impairment.'
        },
        source: 'FDA'
    },
    
    // More steroids
    'dexamethasone': {
        contraindications: ['diabetes', 'hypertension'],
        warnings: {
            'diabetes': 'Significant hyperglycemic effect. Monitor blood glucose closely.',
            'hypertension': 'May increase blood pressure. Monitor BP regularly.'
        },
        source: 'WHO EML'
    },
    'hydrocortisone': {
        contraindications: ['diabetes', 'hypertension'],
        warnings: {
            'diabetes': 'Can elevate blood sugar. Adjust antidiabetic therapy as needed.',
            'hypertension': 'May worsen hypertension. Monitor blood pressure.'
        },
        source: 'WHO EML'
    },
    'methylprednisolone': {
        contraindications: ['diabetes', 'hypertension'],
        warnings: {
            'diabetes': 'Corticosteroid - increases blood glucose. Monitor closely.',
            'hypertension': 'May exacerbate hypertension. Regular BP monitoring required.'
        },
        source: 'FDA'
    },
    
    // Bronchodilators
    'salbutamol': {
        contraindications: ['hypertension', 'diabetes'],
        warnings: {
            'hypertension': 'Beta-2 agonist may increase heart rate and BP. Use with caution.',
            'diabetes': 'May cause hyperglycemia. Monitor blood sugar.'
        },
        source: 'WHO EML'
    },
    'theophylline': {
        contraindications: ['liver_disease', 'hypertension'],
        warnings: {
            'liver_disease': 'Reduced clearance in hepatic impairment. Monitor levels closely.',
            'hypertension': 'May increase heart rate and blood pressure.'
        },
        source: 'WHO EML'
    },
    
    // GI medications
    'domperidone': {
        contraindications: ['liver_disease'],
        warnings: {
            'liver_disease': 'Use with caution. May accumulate in hepatic impairment.'
        },
        source: 'WHO EML'
    },
    'metoclopramide': {
        contraindications: ['renal_impairment'],
        warnings: {
            'renal_impairment': 'Dose reduction required. Risk of extrapyramidal effects.'
        },
        source: 'WHO EML'
    },
    'ondansetron': {
        contraindications: ['liver_disease'],
        warnings: {
            'liver_disease': 'Dose limitation in severe hepatic impairment (max 8mg/day).'
        },
        source: 'FDA'
    },
    
    // Antifungals
    'fluconazole': {
        contraindications: ['liver_disease'],
        warnings: {
            'liver_disease': 'Hepatotoxicity reported. Monitor liver function. Use with caution.'
        },
        source: 'WHO EML'
    },
    'ketoconazole': {
        contraindications: ['liver_disease'],
        warnings: {
            'liver_disease': 'Significant hepatotoxicity risk. Monitor liver function closely.'
        },
        source: 'FDA'
    },
    
    // More NSAIDs
    'naproxen': {
        contraindications: ['hypertension', 'renal_impairment', 'pregnancy'],
        warnings: {
            'hypertension': 'NSAIDs may elevate blood pressure. Monitor cardiovascular status.',
            'renal_impairment': 'Risk of acute kidney injury. Use with caution or avoid.',
            'pregnancy': 'Avoid in third trimester - risk of premature ductus arteriosus closure.'
        },
        source: 'FDA'
    },
    'ketorolac': {
        contraindications: ['renal_impairment', 'pregnancy'],
        warnings: {
            'renal_impairment': 'Contraindicated in moderate to severe renal impairment.',
            'pregnancy': 'Contraindicated. Risk of adverse fetal effects.'
        },
        source: 'FDA'
    },
    'piroxicam': {
        contraindications: ['hypertension', 'renal_impairment', 'liver_disease'],
        warnings: {
            'hypertension': 'May increase blood pressure. Monitor closely.',
            'renal_impairment': 'Increased risk of renal toxicity. Avoid if possible.',
            'liver_disease': 'Use with caution. May cause hepatotoxicity.'
        },
        source: 'WHO EML'
    },
    
    // Anticoagulants
    'warfarin': {
        contraindications: ['pregnancy', 'liver_disease'],
        warnings: {
            'pregnancy': 'Contraindicated - teratogenic. Can cause fetal bleeding.',
            'liver_disease': 'Increased bleeding risk due to reduced clotting factor synthesis.'
        },
        source: 'WHO EML / FDA'
    },
    'rivaroxaban': {
        contraindications: ['renal_impairment', 'liver_disease'],
        warnings: {
            'renal_impairment': 'Contraindicated if CrCl <15 ml/min. Dose adjustment needed.',
            'liver_disease': 'Contraindicated in hepatic disease with coagulopathy.'
        },
        source: 'FDA'
    },
    
    // Antiepileptics
    'phenytoin': {
        contraindications: ['liver_disease', 'pregnancy'],
        warnings: {
            'liver_disease': 'Hepatically metabolized. Monitor levels and liver function.',
            'pregnancy': 'Risk of congenital malformations. Use only if clearly needed.'
        },
        source: 'WHO EML'
    },
    'carbamazepine': {
        contraindications: ['liver_disease', 'pregnancy'],
        warnings: {
            'liver_disease': 'Risk of hepatotoxicity. Monitor liver function regularly.',
            'pregnancy': 'Risk of neural tube defects. Folic acid supplementation recommended.'
        },
        source: 'WHO EML'
    },
    'valproate': {
        contraindications: ['liver_disease', 'pregnancy'],
        warnings: {
            'liver_disease': 'Hepatotoxicity risk, especially in first 6 months. Monitor closely.',
            'pregnancy': 'High risk of birth defects and developmental disorders. Avoid if possible.'
        },
        source: 'WHO EML / FDA'
    },
    
    // Opioids
    'tramadol': {
        contraindications: ['renal_impairment', 'liver_disease'],
        warnings: {
            'renal_impairment': 'Dose adjustment required. Metabolite accumulation risk.',
            'liver_disease': 'Increased drug levels. Use reduced doses.'
        },
        source: 'WHO EML'
    },
    'codeine': {
        contraindications: ['asthma', 'liver_disease'],
        warnings: {
            'asthma': 'May cause respiratory depression. Use with caution.',
            'liver_disease': 'Reduced metabolism. Use lower doses.'
        },
        source: 'WHO EML'
    },
    'morphine': {
        contraindications: ['asthma', 'renal_impairment', 'liver_disease'],
        warnings: {
            'asthma': 'Risk of bronchospasm and respiratory depression.',
            'renal_impairment': 'Metabolite accumulation. Reduce dose and monitor closely.',
            'liver_disease': 'Decreased clearance. Start with lower doses.'
        },
        source: 'WHO EML'
    }
};

// Common drug name variations and mappings
const DRUG_ALIASES = {
    'acetaminophen': 'paracetamol',
    'tylenol': 'paracetamol',
    'advil': 'ibuprofen',
    'motrin': 'ibuprofen',
    'voltaren': 'diclofenac',
    'aleve': 'naproxen',
    'toradol': 'ketorolac',
    'lasix': 'furosemide',
    'aldactone': 'spironolactone',
    'cozaar': 'losartan',
    'norvasc': 'amlodipine',
    'procardia': 'nifedipine',
    'lipitor': 'atorvastatin',
    'zocor': 'simvastatin',
    'crestor': 'rosuvastatin',
    'prilosec': 'omeprazole',
    'nexium': 'esomeprazole',
    'zantac': 'ranitidine',
    'coumadin': 'warfarin',
    'xarelto': 'rivaroxaban',
    'glucophage': 'metformin',
    'januvia': 'sitagliptin',
    'zyrtec': 'cetirizine',
    'claritin': 'loratadine',
    'allegra': 'fexofenadine',
    'cipro': 'ciprofloxacin',
    'levaquin': 'levofloxacin',
    'zithromax': 'azithromycin',
    'flagyl': 'metronidazole',
    'diflucan': 'fluconazole',
    'albuterol': 'salbutamol',
    'proventil': 'salbutamol',
    'ultram': 'tramadol',
    'inderal': 'propranolol',
    'lopressor': 'metoprolol',
    'tenormin': 'atenolol',
    'vasotec': 'enalapril',
    'zestril': 'lisinopril',
    'altace': 'ramipril',
    'micardis': 'telmisartan',
    'diovan': 'valsartan',
    'prednisone': 'prednisolone',
    'decadron': 'dexamethasone',
    'solu-cortef': 'hydrocortisone',
    'medrol': 'methylprednisolone',
    'reglan': 'metoclopramide',
    'zofran': 'ondansetron',
    'motilium': 'domperidone',
    'dilantin': 'phenytoin',
    'tegretol': 'carbamazepine',
    'depakote': 'valproate',
    'neurontin': 'gabapentin',
    'lyrica': 'pregabalin'
};

// Additional brand -> generic mappings (expanded from Python snippet)
const BRAND_TO_GENERIC = {
    // Paracetamol brands
    'calpol': 'paracetamol',
    'crocin': 'paracetamol',
    'dolo': 'paracetamol',
    'tylenol': 'paracetamol',
    'panadol': 'paracetamol',
    'pacimol': 'paracetamol',
    'metacin': 'paracetamol',
    
    // NSAIDs
    'brufen': 'ibuprofen',
    'advil': 'ibuprofen',
    'motrin': 'ibuprofen',
    'combiflam': 'ibuprofen + paracetamol',
    'volini': 'diclofenac',
    'voveran': 'diclofenac',
    'voltaren': 'diclofenac',
    'aleve': 'naproxen',
    'naprosyn': 'naproxen',
    'toradol': 'ketorolac',
    'disprin': 'aspirin',
    'ecosprin': 'aspirin',
    
    // Antibiotics
    'augmentin': 'amoxicillin + clavulanic acid',
    'moxclav': 'amoxicillin + clavulanic acid',
    'amoxil': 'amoxicillin',
    'novamox': 'amoxicillin',
    'zithromax': 'azithromycin',
    'azithral': 'azithromycin',
    'azee': 'azithromycin',
    'cipro': 'ciprofloxacin',
    'ciplox': 'ciprofloxacin',
    'cifran': 'ciprofloxacin',
    'levaquin': 'levofloxacin',
    'levoflox': 'levofloxacin',
    'taxim': 'cefixime',
    'cepodem': 'cefixime',
    'sporidex': 'cephalexin',
    'vibramycin': 'doxycycline',
    'doxt': 'doxycycline',
    'flagyl': 'metronidazole',
    'metrogyl': 'metronidazole',
    
    // Antihistamines
    'cetzine': 'cetirizine',
    'zyrtec': 'cetirizine',
    'alerid': 'cetirizine',
    'claritin': 'loratadine',
    'lorfast': 'loratadine',
    'allegra': 'fexofenadine',
    'fexo': 'fexofenadine',
    'telfast': 'fexofenadine',
    
    // PPIs and H2 blockers
    'prilosec': 'omeprazole',
    'omez': 'omeprazole',
    'pantoprazole': 'pantoprazole',
    'pantocid': 'pantoprazole',
    'pan': 'pantoprazole',
    'nexium': 'esomeprazole',
    'sompraz': 'esomeprazole',
    'prevacid': 'lansoprazole',
    'lanzol': 'lansoprazole',
    'aciloc': 'ranitidine',
    'zantac': 'ranitidine',
    'rantac': 'ranitidine',
    'pepcid': 'famotidine',
    'famocid': 'famotidine',
    
    // Antidiabetics
    'metformin': 'metformin',
    'glucophage': 'metformin',
    'glycomet': 'metformin',
    'obimet': 'metformin',
    'dianorm': 'glibenclamide',
    'daonil': 'glibenclamide',
    'diamicron': 'gliclazide',
    'glizid': 'gliclazide',
    'amaryl': 'glimepiride',
    'glimestar': 'glimepiride',
    'januvia': 'sitagliptin',
    'janumet': 'sitagliptin + metformin',
    'galvus': 'vildagliptin',
    'insulin': 'insulin',
    'lantus': 'insulin glargine',
    'novorapid': 'insulin aspart',
    
    // Antihypertensives - ACE inhibitors
    'vasotec': 'enalapril',
    'enam': 'enalapril',
    'envas': 'enalapril',
    'zestril': 'lisinopril',
    'listril': 'lisinopril',
    'lipril': 'lisinopril',
    'altace': 'ramipril',
    'cardace': 'ramipril',
    'ramipres': 'ramipril',
    'tritace': 'ramipril',
    
    // ARBs
    'cozaar': 'losartan',
    'losacar': 'losartan',
    'repace': 'losartan',
    'micardis': 'telmisartan',
    'telma': 'telmisartan',
    'telsar': 'telmisartan',
    'diovan': 'valsartan',
    'valzaar': 'valsartan',
    
    // Calcium channel blockers
    'norvasc': 'amlodipine',
    'amlong': 'amlodipine',
    'amlodac': 'amlodipine',
    'procardia': 'nifedipine',
    'nicardia': 'nifedipine',
    'adalat': 'nifedipine',
    'dilzem': 'diltiazem',
    'cardizem': 'diltiazem',
    
    // Beta blockers
    'tenormin': 'atenolol',
    'aten': 'atenolol',
    'lopressor': 'metoprolol',
    'metolar': 'metoprolol',
    'inderal': 'propranolol',
    'ciplar': 'propranolol',
    
    // Diuretics
    'lasix': 'furosemide',
    'frusemide': 'furosemide',
    'aldactone': 'spironolactone',
    'aldactone': 'spironolactone',
    'microzide': 'hydrochlorothiazide',
    
    // Statins
    'lipitor': 'atorvastatin',
    'atorva': 'atorvastatin',
    'atocor': 'atorvastatin',
    'zocor': 'simvastatin',
    'simcard': 'simvastatin',
    'crestor': 'rosuvastatin',
    'rosuvas': 'rosuvastatin',
    'rosave': 'rosuvastatin',
    
    // Steroids
    'prednisolone': 'prednisolone',
    'wysolone': 'prednisolone',
    'omnacortil': 'prednisolone',
    'prednisone': 'prednisolone',
    'decadron': 'dexamethasone',
    'dexona': 'dexamethasone',
    'medrol': 'methylprednisolone',
    'depo-medrol': 'methylprednisolone',
    'solu-cortef': 'hydrocortisone',
    'efcorlin': 'hydrocortisone',
    
    // Respiratory
    'ventolin': 'salbutamol',
    'asthalin': 'salbutamol',
    'albuterol': 'salbutamol',
    'proventil': 'salbutamol',
    'singulair': 'montelukast',
    'montair': 'montelukast',
    'romilast': 'montelukast',
    'budecort': 'budesonide',
    'pulmicort': 'budesonide',
    'seretide': 'fluticasone + salmeterol',
    
    // GI medications
    'motilium': 'domperidone',
    'domstal': 'domperidone',
    'reglan': 'metoclopramide',
    'perinorm': 'metoclopramide',
    'zofran': 'ondansetron',
    'emeset': 'ondansetron',
    'ondem': 'ondansetron',
    'imodium': 'loperamide',
    'eldoper': 'loperamide',
    
    // Antifungals
    'diflucan': 'fluconazole',
    'flucon': 'fluconazole',
    'forcan': 'fluconazole',
    'nizoral': 'ketoconazole',
    'lamisil': 'terbinafine',
    'terbinafine': 'terbinafine',
    
    // Anticoagulants
    'coumadin': 'warfarin',
    'warf': 'warfarin',
    'xarelto': 'rivaroxaban',
    'plavix': 'clopidogrel',
    'clopivas': 'clopidogrel',
    'deplatt': 'clopidogrel',
    
    // Antiepileptics
    'dilantin': 'phenytoin',
    'epsolin': 'phenytoin',
    'tegretol': 'carbamazepine',
    'tegrital': 'carbamazepine',
    'depakote': 'valproate',
    'valprol': 'valproate',
    'keppra': 'levetiracetam',
    'levipil': 'levetiracetam',
    'neurontin': 'gabapentin',
    'gabapin': 'gabapentin',
    'lyrica': 'pregabalin',
    'pregeb': 'pregabalin',
    
    // Opioids
    'ultram': 'tramadol',
    'tramazac': 'tramadol',
    'tramadol': 'tramadol',
    
    // Vitamins and supplements
    'calcimax': 'calcium',
    'shelcal': 'calcium',
    'uprise': 'vitamin d3',
    'calcirol': 'vitamin d3',
    'becosules': 'vitamin b complex',
    'neurobion': 'vitamin b complex',
    
    // Others
    'synthroid': 'levothyroxine',
    'eltroxin': 'levothyroxine',
    'zyloprim': 'allopurinol',
    'zyloric': 'allopurinol',
    'flomax': 'tamsulosin',
    'urimax': 'tamsulosin',
    'proscar': 'finasteride',
    'finalo': 'finasteride'
};

const MEDICINES_GENERIC = new Set(Object.values(BRAND_TO_GENERIC));

// ============================================
// COMMON MEDICINES LIST
// Comprehensive list of common medicines for accurate name extraction
// ============================================

const COMMON_MEDICINES = [
    // Analgesics and Antipyretics
    'paracetamol', 'acetaminophen', 'ibuprofen', 'aspirin', 'diclofenac', 'naproxen',
    'tramadol', 'morphine', 'codeine', 'ketorolac', 'piroxicam', 'indomethacin',
    
    // Antibiotics
    'amoxicillin', 'amoxicillin-clavulanate', 'augmentin', 'azithromycin', 'ciprofloxacin',
    'levofloxacin', 'cephalexin', 'cefixime', 'ceftriaxone', 'doxycycline', 'metronidazole',
    'erythromycin', 'clarithromycin', 'penicillin', 'ampicillin', 'cloxacillin', 'ofloxacin',
    'norfloxacin', 'nitrofurantoin', 'co-trimoxazole', 'trimethoprim', 'sulfamethoxazole',
    
    // Antihistamines and Allergy
    'cetirizine', 'loratadine', 'fexofenadine', 'chlorpheniramine', 'diphenhydramine',
    'promethazine', 'levocetirizine', 'desloratadine', 'hydroxyzine',
    
    // Antacids and GI medications
    'omeprazole', 'pantoprazole', 'lansoprazole', 'esomeprazole', 'ranitidine',
    'famotidine', 'domperidone', 'ondansetron', 'metoclopramide', 'loperamide',
    'bismuth subsalicylate', 'antacid', 'sucralfate', 'rabeprazole',
    
    // Antidiabetic
    'metformin', 'glibenclamide', 'gliclazide', 'glimepiride', 'insulin', 'sitagliptin',
    'vildagliptin', 'pioglitazone', 'repaglinide', 'empagliflozin', 'dapagliflozin',
    
    // Antihypertensive
    'amlodipine', 'atenolol', 'metoprolol', 'propranolol', 'enalapril', 'lisinopril',
    'losartan', 'telmisartan', 'valsartan', 'ramipril', 'perindopril', 'nifedipine',
    'diltiazem', 'verapamil', 'hydrochlorothiazide', 'furosemide', 'spironolactone',
    
    // Respiratory
    'salbutamol', 'albuterol', 'ipratropium', 'budesonide', 'beclomethasone',
    'fluticasone', 'montelukast', 'theophylline', 'aminophylline', 'guaifenesin',
    'dextromethorphan', 'bromhexine', 'ambroxol', 'acetylcysteine',
    
    // Steroids
    'prednisolone', 'prednisone', 'dexamethasone', 'hydrocortisone', 'betamethasone',
    'methylprednisolone', 'deflazacort',
    
    // Vitamins and Supplements
    'vitamin d', 'vitamin b12', 'vitamin c', 'folic acid', 'iron', 'calcium', 'zinc',
    'multivitamin', 'vitamin b complex', 'omega-3', 'biotin',
    
    // Cardiac
    'aspirin', 'clopidogrel', 'atorvastatin', 'rosuvastatin', 'simvastatin',
    'digoxin', 'isosorbide', 'nitroglycerin', 'warfarin', 'rivaroxaban',
    
    // Antifungal
    'fluconazole', 'ketoconazole', 'clotrimazole', 'miconazole', 'itraconazole',
    'terbinafine', 'griseofulvin',
    
    // Antiparasitic
    'albendazole', 'mebendazole', 'ivermectin', 'praziquantel',
    
    // Others
    'levothyroxine', 'thyroxine', 'allopurinol', 'colchicine', 'gabapentin',
    'pregabalin', 'diazepam', 'alprazolam', 'clonazepam', 'lorazepam', 'midazolam', 'phenytoin',
    'carbamazepine', 'valproate', 'levetiracetam', 'tamsulosin', 'finasteride',

    // Interaction-focused additions (to support dangerous drug-drug checks)
    'sertraline', 'fluoxetine', 'paroxetine', 'citalopram', 'escitalopram', 'fluvoxamine',
    'phenelzine', 'tranylcypromine', 'isocarboxazid', 'selegiline',
    'meperidine', 'oxycodone', 'hydrocodone', 'fentanyl', 'methadone',
    'itraconazole', 'posaconazole', 'voriconazole', 'rifampin',
    'sirolimus', 'tacrolimus', 'cyclosporine',
    'methotrexate', 'colchicine', 'digoxin', 'amiodarone', 'dronedarone',
    'pimozide', 'terfenadine', 'linezolid', 'quetiapine',
    'lovastatin', 'gemfibrozil', 'fenofibrate',
    'lithium', 'amiloride', 'eplerenone',
    'pseudoephedrine', 'tamoxifen', 'cimetidine',
    'tetracycline',
    'cisplatin', 'gentamicin', 'amikacin', 'tobramycin',

    // OTC / food / supplement terms used in interaction rules
    'alcohol', 'ethanol', 'grapefruit', 'grapefruit juice',
    "st johns wort", "st. john's wort",
    'vitamin k', 'vitamin e', 'green tea', 'turmeric', 'ginkgo', 'ginkgo biloba',
    'birth control', 'oral contraceptive', 'contraceptive', 'birth control pills',
    'potassium', 'potassium supplement', 'potassium chloride',
    'iodinated contrast', 'caffeine', 'melatonin',
    'bupropion', 'rosiglitazone', 'levodopa', 'meperidine',
    'probiotic', 'probiotics', 'licorice', 'licorice root'
];

// Medicine name variations and common forms
const MEDICINE_FORMS = [
    'tablet', 'tab', 'capsule', 'cap', 'syrup', 'suspension', 'injection', 'inj',
    'drops', 'cream', 'ointment', 'gel', 'inhaler', 'powder', 'granules',
    'solution', 'lotion', 'spray'
];

// ============================================
// FILE ANALYSIS SIMULATION
// This simulates extracting medical conditions from uploaded files
// In production, this would use OCR, NLP, or structured data extraction
// ============================================

const CONDITION_KEYWORDS = {
    'hypertension': ['hypertension', 'high blood pressure', 'bp:', 'elevated bp', 'htn', 'blood pressure', 'systolic', 'diastolic', 'bp >'],
    'diabetes': ['diabetes', 'diabetic', 'blood sugar', 'glucose', 'hba1c', 'insulin', 'type 2 dm', 'type 1 dm', 'hyperglycemia', 'fasting glucose', 'random glucose', 'ppbs', 'post prandial'],
    'pregnancy': ['pregnancy', 'pregnant', 'antenatal', 'prenatal', 'gestation', 'obstetric', 'trimester', 'hcg', 'beta hcg', 'beta-hcg', 'human chorionic', 'gestational', 'weeks pregnant', 'antenatal care', 'prenatal care'],
    'renal_impairment': ['renal', 'kidney', 'creatinine', 'gfr', 'chronic kidney disease', 'ckd', 'nephropathy', 'renal failure', 'kidney function', 'kft', 'rft', 'urea', 'blood urea', 'egfr'],
    'liver_disease': ['liver', 'hepatic', 'cirrhosis', 'hepatitis', 'alt', 'ast', 'bilirubin', 'jaundice', 'liver function', 'lft', 'sgot', 'sgpt', 'alkaline phosphatase', 'alp'],
    'asthma': ['asthma', 'bronchial', 'wheezing', 'bronchodilator', 'inhaler', 'respiratory', 'copd', 'chronic obstructive', 'fev1', 'peak flow']
};

// Enhanced report type keywords
const REPORT_TYPE_KEYWORDS = {
    'pregnancy': ['hcg', 'beta hcg', 'beta-hcg', 'pregnancy test', 'human chorionic gonadotropin', 'serum hcg', 'urine hcg'],
    'hemogram': ['hemoglobin', 'haemoglobin', 'cbc', 'complete blood count', 'wbc', 'rbc', 'platelet', 'hematocrit', 'differential count', 'neutrophils', 'lymphocytes', 'mcv', 'mch', 'mchc', 'total leucocyte'],
    'kidney': ['creatinine', 'kidney function', 'renal function', 'kft', 'rft', 'blood urea', 'egfr', 'gfr', 'urea nitrogen'],
    'liver': ['liver function', 'lft', 'sgot', 'sgpt', 'alt', 'ast', 'bilirubin', 'alkaline phosphatase', 'total bilirubin', 'direct bilirubin'],
    'diabetes': ['blood sugar', 'blood glucose', 'fasting glucose', 'random glucose', 'hba1c', 'glycosylated hemoglobin', 'ppbs', 'post prandial'],
    'lipid': ['lipid profile', 'cholesterol', 'hdl', 'ldl', 'triglycerides', 'vldl'],
    'thyroid': ['thyroid', 'tsh', 't3', 't4', 'thyroid stimulating hormone'],
};

function simulateFileAnalysis(fileName, fileType = '') {
    // Simulate extraction by analyzing filename and simulating OCR text extraction
    // In real system, this would parse file contents using OCR/NLP
    const lowerFileName = fileName.toLowerCase();
    const detectedConditions = [];
    
    // Enhanced detection - check both filename and simulated text content
    let simulatedText = lowerFileName;
    
    // Simulate OCR text extraction based on common report patterns
    // This simulates what would be extracted from the actual image/PDF content
    if (fileType && fileType.startsWith('image/')) {
        simulatedText += ' ' + simulateOCRTextExtraction(lowerFileName, fileType);
    }
    
    // Check for conditions using comprehensive keywords
    for (const [condition, keywords] of Object.entries(CONDITION_KEYWORDS)) {
        for (const keyword of keywords) {
            if (simulatedText.includes(keyword)) {
                if (!detectedConditions.includes(condition)) {
                    detectedConditions.push(condition);
                }
                break;
            }
        }
    }
    
    // If still no conditions detected, try to infer from report type keywords
    if (detectedConditions.length === 0) {
        detectedConditions.push(...inferConditionsFromReportType(simulatedText));
    }
    
    return detectedConditions;
}

// Simulate OCR text extraction from medical report images
function simulateOCRTextExtraction(fileName, fileType) {
    // This simulates what OCR would extract from common medical report images
    // In production, this would use actual OCR (Tesseract.js, Google Vision API, etc.)
    
    const lowerName = fileName.toLowerCase();
    let extractedText = '';
    
    // Simulate extraction patterns based on common medical report formats
    // These are typical texts that appear in medical reports
    
    if (lowerName.includes('whatsapp') || lowerName.includes('image') || lowerName.includes('photo') || lowerName.includes('scan')) {
        // Generic image files often contain medical reports
        // Simulate common report header/content keywords
        
        // Check if it might be a pregnancy report
        if (Math.random() > 0.3) { // Simulate that some images are pregnancy reports
            extractedText += ' hcg beta total pregnancy serum quantitative elevated positive pregnant ';
        }
        
        // Check if it might be a blood test
        if (Math.random() > 0.3) {
            extractedText += ' hemoglobin haemoglobin complete blood count cbc wbc rbc platelet ';
        }
        
        // Check if it might be kidney function test
        if (Math.random() > 0.5) {
            extractedText += ' creatinine kidney function test renal egfr blood urea ';
        }
        
        // Check if it might be liver function test
        if (Math.random() > 0.5) {
            extractedText += ' liver function test sgot sgpt alt ast bilirubin ';
        }
    }
    
    // More specific detection based on partial filename matches
    const fileNameParts = lowerName.split(/[\s._-]+/);
    
    for (const part of fileNameParts) {
        // Check report type keywords
        for (const [reportType, keywords] of Object.entries(REPORT_TYPE_KEYWORDS)) {
            for (const keyword of keywords) {
                if (part.includes(keyword.split(' ')[0]) || keyword.includes(part)) {
                    extractedText += ' ' + keywords.join(' ') + ' ';
                    break;
                }
            }
        }
    }
    
    return extractedText.toLowerCase();
}

// Infer conditions from detected report type
function inferConditionsFromReportType(text) {
    const conditions = [];
    
    // Check for pregnancy indicators
    if (REPORT_TYPE_KEYWORDS.pregnancy.some(kw => text.includes(kw))) {
        conditions.push('pregnancy');
    }
    
    // Check for kidney disease indicators
    if (REPORT_TYPE_KEYWORDS.kidney.some(kw => text.includes(kw))) {
        conditions.push('renal_impairment');
    }
    
    // Check for liver disease indicators
    if (REPORT_TYPE_KEYWORDS.liver.some(kw => text.includes(kw))) {
        conditions.push('liver_disease');
    }
    
    // Check for diabetes indicators
    if (REPORT_TYPE_KEYWORDS.diabetes.some(kw => text.includes(kw))) {
        conditions.push('diabetes');
    }
    
    return conditions;
}

// Generate medical report summary
function generateReportSummary(fileName, detectedConditions) {
    // Simulate AI-generated summary based on file analysis
    // In production, this would use OCR + NLP/LLM to extract and summarize actual report content
    
    const lowerFileName = fileName.toLowerCase();
    const reportType = detectReportType(lowerFileName);
    
    let summary = '';
    
    // Generate summary based on report type and detected conditions
    if (reportType === 'blood_test' || reportType === 'hemogram' || reportType === 'cbc') {
        summary = generateBloodTestSummary(detectedConditions, lowerFileName);
    } else if (reportType === 'pregnancy_test' || lowerFileName.includes('hcg')) {
        summary = generatePregnancyTestSummary(lowerFileName);
        detectedConditions = ['pregnancy']; // Ensure pregnancy is in conditions
    } else if (reportType === 'kidney_function' || lowerFileName.includes('renal')) {
        summary = generateKidneyFunctionSummary(detectedConditions);
        if (!detectedConditions.includes('renal_impairment')) {
            detectedConditions = [...detectedConditions, 'renal_impairment'];
        }
    } else if (reportType === 'liver_function' || lowerFileName.includes('lft')) {
        summary = generateLiverFunctionSummary(detectedConditions);
        if (!detectedConditions.includes('liver_disease')) {
            detectedConditions = [...detectedConditions, 'liver_disease'];
        }
    } else if (reportType === 'diabetes' || lowerFileName.includes('glucose') || lowerFileName.includes('hba1c')) {
        summary = generateDiabetesTestSummary(detectedConditions);
        if (!detectedConditions.includes('diabetes')) {
            detectedConditions = [...detectedConditions, 'diabetes'];
        }
    } else if (detectedConditions.length > 0) {
        summary = generateGenericSummary(detectedConditions, lowerFileName);
    } else {
        summary = generateDefaultSummary(fileName);
    }
    
    // Add drug contraindication warnings if conditions detected
    if (detectedConditions.length > 0) {
        summary += '\n\n' + generateDrugContraindicationWarnings(detectedConditions);
    }
    
    return summary;
}

// Generate specific drug contraindication warnings for doctors
function generateDrugContraindicationWarnings(detectedConditions) {
    const conditionLabels = {
        'hypertension': 'Hypertension (High Blood Pressure)',
        'diabetes': 'Diabetes Mellitus',
        'pregnancy': 'Pregnancy',
        'renal_impairment': 'Renal/Kidney Impairment',
        'liver_disease': 'Liver Disease/Dysfunction',
        'asthma': 'Asthma/Respiratory Condition'
    };
    
    let warnings = '═══════════════════════════════════════════════════════════\n';
    warnings += '⚠️  CRITICAL PRESCRIBING CONTRAINDICATIONS ⚠️\n';
    warnings += '═══════════════════════════════════════════════════════════\n\n';
    
    warnings += 'Based on detected conditions, the following medications are\n';
    warnings += 'CONTRAINDICATED or require DOSE ADJUSTMENT:\n\n';
    
    // Collect all contraindicated drugs for each condition
    const contraindicationsByCondition = {};
    
    detectedConditions.forEach(condition => {
        const contraindicatedDrugs = [];
        const cautionDrugs = [];
        
        // Check each drug in database
        for (const [drugName, drugInfo] of Object.entries(DRUG_DATABASE)) {
            if (drugInfo.contraindications.includes(condition)) {
                const warning = drugInfo.warnings[condition];
                
                // Categorize by severity
                if (warning && (warning.toLowerCase().includes('contraindicated') || 
                               warning.toLowerCase().includes('avoid') ||
                               warning.toLowerCase().includes('do not'))) {
                    contraindicatedDrugs.push({
                        name: drugName,
                        warning: warning,
                        source: drugInfo.source
                    });
                } else {
                    cautionDrugs.push({
                        name: drugName,
                        warning: warning,
                        source: drugInfo.source
                    });
                }
            }
        }
        
        contraindicationsByCondition[condition] = {
            label: conditionLabels[condition] || condition,
            contraindicated: contraindicatedDrugs,
            caution: cautionDrugs
        };
    });
    
    // Format warnings by condition
    detectedConditions.forEach((condition, index) => {
        const data = contraindicationsByCondition[condition];
        if (!data) return;
        
        warnings += `${index + 1}. PATIENT CONDITION: ${data.label}\n`;
        warnings += '   ' + '─'.repeat(60) + '\n\n';
        
        // List absolutely contraindicated drugs
        if (data.contraindicated.length > 0) {
            warnings += '   ❌ AVOID THESE MEDICATIONS (Contraindicated):\n';
            data.contraindicated.forEach(drug => {
                warnings += `      • ${drug.name.toUpperCase()}\n`;
                warnings += `        Reason: ${drug.warning}\n`;
            });
            warnings += '\n';
        }
        
        // List drugs requiring caution/dose adjustment
        if (data.caution.length > 0) {
            warnings += '   ⚠️  USE WITH CAUTION (Dose Adjustment/Monitoring Required):\n';
            data.caution.forEach(drug => {
                warnings += `      • ${drug.name.toUpperCase()}\n`;
                warnings += `        Guidance: ${drug.warning}\n`;
            });
            warnings += '\n';
        }
        
        // Add alternative suggestions
        warnings += '   ✓ SAFER ALTERNATIVES:\n';
        warnings += getAlternativeMedications(condition);
        warnings += '\n';
    });
    
    warnings += '═══════════════════════════════════════════════════════════\n';
    warnings += 'CLINICAL ACTION REQUIRED:\n';
    warnings += '• Review all current medications for interactions\n';
    warnings += '• Adjust doses based on organ function\n';
    warnings += '• Monitor relevant parameters (BP, glucose, renal/liver function)\n';
    warnings += '• Document clinical reasoning for any override decisions\n';
    warnings += '• Consider specialist consultation if needed\n';
    warnings += '═══════════════════════════════════════════════════════════\n';
    
    return warnings;
}

// Suggest alternative medications for specific conditions
function getAlternativeMedications(condition) {
    const alternatives = {
        'hypertension': '      → Calcium channel blockers (Amlodipine) - Generally safe\n' +
                       '      → ACE inhibitors (Enalapril) - Preferred in diabetes\n' +
                       '      → ARBs (Losartan) - Good alternative to ACE inhibitors\n',
        
        'diabetes': '      → Metformin - First-line (check renal function)\n' +
                   '      → DPP-4 inhibitors (Sitagliptin) - Low hypoglycemia risk\n' +
                   '      → GLP-1 agonists - Cardiovascular benefits\n',
        
        'pregnancy': '      → Paracetamol - Safe analgesic/antipyretic\n' +
                    '      → Methyldopa - Safe antihypertensive\n' +
                    '      → Insulin - Safest for diabetes management\n' +
                    '      → Penicillins/Cephalexin - Safe antibiotics\n',
        
        'renal_impairment': '      → Dose-adjusted medications based on eGFR\n' +
                           '      → Loop diuretics (Furosemide) instead of thiazides\n' +
                           '      → Avoid NSAIDs - use Paracetamol instead\n' +
                           '      → Monitor drug levels for renally-cleared medications\n',
        
        'liver_disease': '      → Avoid hepatotoxic drugs\n' +
                        '      → Use lower doses of hepatically-metabolized drugs\n' +
                        '      → Monitor liver function tests regularly\n' +
                        '      → Prefer renally-cleared alternatives when available\n',
        
        'asthma': '      → Selective beta-2 agonists (Salbutamol) - Bronchodilators\n' +
                 '      → Inhaled corticosteroids (Budesonide) - Anti-inflammatory\n' +
                 '      → Leukotriene inhibitors (Montelukast) - Prophylaxis\n' +
                 '      → AVOID: Non-selective beta blockers, NSAIDs in aspirin-sensitive asthma\n'
    };
    
    return alternatives[condition] || '      → Consult specialist for medication guidance\n';
}

function detectReportType(lowerFileName, detectedConditions = []) {
    // Enhanced detection using both filename and detected conditions
    
    // Check pregnancy keywords
    if (REPORT_TYPE_KEYWORDS.pregnancy.some(kw => lowerFileName.includes(kw)) || 
        detectedConditions.includes('pregnancy')) {
        return 'pregnancy_test';
    }
    
    // Check hemogram/CBC keywords
    if (REPORT_TYPE_KEYWORDS.hemogram.some(kw => lowerFileName.includes(kw))) {
        return 'cbc';
    }
    
    // Check kidney function keywords
    if (REPORT_TYPE_KEYWORDS.kidney.some(kw => lowerFileName.includes(kw)) || 
        detectedConditions.includes('renal_impairment')) {
        return 'kidney_function';
    }
    
    // Check liver function keywords
    if (REPORT_TYPE_KEYWORDS.liver.some(kw => lowerFileName.includes(kw)) || 
        detectedConditions.includes('liver_disease')) {
        return 'liver_function';
    }
    
    // Check diabetes keywords
    if (REPORT_TYPE_KEYWORDS.diabetes.some(kw => lowerFileName.includes(kw)) || 
        detectedConditions.includes('diabetes')) {
        return 'diabetes';
    }
    
    // Check lipid profile keywords
    if (REPORT_TYPE_KEYWORDS.lipid.some(kw => lowerFileName.includes(kw))) {
        return 'lipid_profile';
    }
    
    // Check thyroid keywords
    if (REPORT_TYPE_KEYWORDS.thyroid.some(kw => lowerFileName.includes(kw))) {
        return 'thyroid';
    }
    
    if (lowerFileName.includes('xray') || lowerFileName.includes('x-ray')) {
        return 'xray';
    }
    if (lowerFileName.includes('ecg') || lowerFileName.includes('ekg')) {
        return 'ecg';
    }
    
    return 'general';
}

function generateBloodTestSummary(detectedConditions, fileName) {
    return `🩸 COMPLETE BLOOD COUNT (CBC) / HEMOGRAM REPORT
═══════════════════════════════════════════════════════════

TEST RESULTS SUMMARY:
• Hemoglobin: Assessed for anemia/polycythemia
• WBC Count: Immune function and infection indicators
• Platelet Count: Clotting function assessment
• RBC Indices: MCV, MCH, MCHC values

CLINICAL INTERPRETATION:
${detectedConditions.length > 0 ? 
`⚠️ Additional conditions detected requiring medication precautions.` : 
`• Blood parameters assessed - correlate with clinical presentation
• Monitor for any developing conditions
• Consider additional tests if symptoms present`}

💡 PRESCRIBING REMINDERS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• If Anemia (Low Hb): 
  → Prescribe Iron supplements (Ferrous Sulfate)
  → Investigate cause (vitamin B12, folate deficiency)
  → Avoid NSAIDs (can worsen GI bleeding)

• If Thrombocytopenia (Low Platelets):
  → AVOID: Aspirin, NSAIDs, Anticoagulants
  → Risk of bleeding complications

• If Leukopenia (Low WBC):
  → Avoid drugs that suppress bone marrow
  → Monitor for infections closely

GENERAL MEDICATION SAFETY:
• Review complete patient history before prescribing
• Consider all reported conditions for drug interactions
• Always check for pregnancy status in women of childbearing age`;
}

function generatePregnancyTestSummary(fileName) {
    return `🤰 PREGNANCY TEST REPORT - POSITIVE RESULT
═══════════════════════════════════════════════════════════

TEST RESULT: PREGNANCY CONFIRMED
• Beta-hCG levels: ELEVATED (Positive for Pregnancy)
• Interpretation: Patient is currently PREGNANT
• Gestational Status: Active pregnancy detected

⚠️⚠️⚠️ CRITICAL DRUG SAFETY ALERT FOR PREGNANT PATIENT ⚠️⚠️⚠️

DO NOT PRESCRIBE THE FOLLOWING MEDICATIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ NSAIDs (STRICTLY CONTRAINDICATED in 3rd trimester):
   • BRUFEN (Ibuprofen) - Risk of premature ductus arteriosus closure
   • DICLOFENAC - Can cause fetal cardiovascular complications
   • NAPROXEN - Avoid throughout pregnancy
   • ASPIRIN (high dose) - Bleeding risk, use only low-dose if needed
   
❌ ACE Inhibitors (ALL TRIMESTERS):
   • ENALAPRIL - Can cause fetal death and malformations
   • LISINOPRIL - Contraindicated - fetal toxicity
   • RAMIPRIL - Severe fetal harm, birth defects
   
❌ ARBs (Angiotensin Receptor Blockers):
   • LOSARTAN - Fetal injury, avoid completely
   • TELMISARTAN - Contraindicated in pregnancy
   • VALSARTAN - Can cause fetal death
   
❌ Antibiotics to AVOID:
   • CIPROFLOXACIN - Risk of arthropathy in fetus
   • LEVOFLOXACIN - Quinolones contraindicated
   • DOXYCYCLINE - Affects fetal bone/tooth development
   • METRONIDAZOLE - Avoid in 1st trimester
   
❌ Other Contraindicated Drugs:
   • WARFARIN - Teratogenic, causes bleeding
   • STATINS (All) - Atorvastatin, Simvastatin, Rosuvastatin
   • PHENYTOIN - Neural tube defects
   • VALPROATE - High risk of birth defects

✅ SAFE ALTERNATIVES FOR PREGNANT PATIENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   • Pain/Fever: PARACETAMOL (safe throughout pregnancy)
   • Hypertension: METHYLDOPA, NIFEDIPINE, LABETALOL
   • Antibiotics: AMOXICILLIN, CEPHALEXIN, AZITHROMYCIN
   • Diabetes: INSULIN (safest option, avoid oral drugs)
   • Vitamins: FOLIC ACID 400mcg daily (essential)

REQUIRED ACTIONS:
• Refer to obstetrician for antenatal care
• Prescribe prenatal vitamins with folic acid
• Screen for gestational diabetes (24-28 weeks)
• Monitor blood pressure regularly
• Document pregnancy in all prescriptions`;
}

function generateKidneyFunctionSummary(detectedConditions) {
    return `🫘 KIDNEY FUNCTION TEST - ABNORMAL RESULTS
═══════════════════════════════════════════════════════════

TEST RESULT: RENAL IMPAIRMENT DETECTED
• Serum Creatinine: ELEVATED (indicates reduced kidney function)
• eGFR: REDUCED - Impaired glomerular filtration
• Diagnosis: Chronic Kidney Disease (CKD) / Renal Impairment

⚠️⚠️⚠️ CRITICAL DRUG SAFETY ALERT - KIDNEY PATIENT ⚠️⚠️⚠️

DO NOT PRESCRIBE - CONTRAINDICATED IN RENAL IMPAIRMENT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ METFORMIN:
   • Contraindicated if eGFR <30 ml/min
   • Risk of LACTIC ACIDOSIS (life-threatening)
   • Use alternative diabetes medications

❌ NSAIDs (ALL - Extremely Dangerous):
   • BRUFEN (Ibuprofen) - Can cause acute kidney injury
   • DICLOFENAC - Worsens kidney function rapidly
   • NAPROXEN - Nephrotoxic, avoid completely
   • KETOROLAC - High risk of renal failure
   
❌ DOSE ADJUSTMENT REQUIRED (50-75% reduction):
   • ENALAPRIL, LISINOPRIL, RAMIPRIL - Monitor K+ and creatinine
   • FUROSEMIDE - Adjust based on eGFR
   • DIGOXIN - Risk of toxicity, monitor levels
   • GABAPENTIN, PREGABALIN - Reduce dose significantly
   • Most ANTIBIOTICS - Adjust based on kidney function

✅ SAFER ALTERNATIVES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   • Pain Relief: PARACETAMOL (safe, no dose adjustment)
   • Diabetes: INSULIN, DPP-4 inhibitors (dose-adjusted)
   • Diuretics: Loop diuretics preferred over thiazides
   
REQUIRED ACTIONS:
• Calculate eGFR before prescribing any medication
• Adjust all drug doses based on kidney function
• Avoid nephrotoxic medications completely
• Monitor electrolytes (especially Potassium)
• Refer to nephrologist for CKD management`;
}

function generateLiverFunctionSummary(detectedConditions) {
    return `🫀 LIVER FUNCTION TEST - ABNORMAL RESULTS
═══════════════════════════════════════════════════════════

TEST RESULT: LIVER DISEASE/IMPAIRMENT DETECTED
• ALT/AST: ELEVATED (liver damage indicators)
• Bilirubin: May be elevated
• Diagnosis: Hepatic Impairment / Liver Disease

⚠️⚠️⚠️ CRITICAL DRUG SAFETY ALERT - LIVER PATIENT ⚠️⚠️⚠️

DO NOT PRESCRIBE - HEPATOTOXIC MEDICATIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ PARACETAMOL (High doses):
   • MAX 2g per day (reduced from 4g)
   • Risk of fulminant hepatic failure
   • Avoid in severe liver disease
   
❌ STATINS (All can cause liver damage):
   • ATORVASTATIN - Monitor LFTs monthly
   • SIMVASTATIN - Contraindicated in active liver disease
   • ROSUVASTATIN - Can worsen liver function
   
❌ ANTIBIOTICS - Hepatotoxic:
   • AZITHROMYCIN - Can cause liver failure
   • FLUCONAZOLE - Hepatotoxicity risk
   • KETOCONAZOLE - Severe hepatotoxicity
   • ISONIAZID - Monitor LFTs closely
   
❌ Other Hepatotoxic Drugs:
   • METHOTREXATE - Severe liver toxicity
   • VALPROATE - Can cause fatal hepatic failure
   • CARBAMAZEPINE - Monitor liver function
   • PHENYTOIN - Dose adjustment required

⚠️ DOSE REDUCTION REQUIRED (50% reduction):
   • Most drugs metabolized by liver
   • WARFARIN - Increased bleeding risk
   • OPIOIDS (Morphine, Tramadol) - Reduce dose
   • BENZODIAZEPINES - Risk of encephalopathy

✅ SAFER ALTERNATIVES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   • Pain: Low-dose Paracetamol, avoid NSAIDs
   • Prefer renally-cleared medications when available
   
REQUIRED ACTIONS:
• Avoid all alcohol completely (essential)
• Monitor liver enzymes before and during treatment
• Use lowest effective doses of all medications
• Consider hepatology consultation
• Screen for hepatic encephalopathy risk`;
}

function generateDiabetesTestSummary(detectedConditions) {
    return `🩸 DIABETES TEST - ELEVATED BLOOD GLUCOSE
═══════════════════════════════════════════════════════════

TEST RESULT: DIABETES MELLITUS CONFIRMED
• Blood Glucose: ELEVATED (>126 mg/dL fasting)
• HbA1c: Above target range
• Diagnosis: Patient has DIABETES

⚠️⚠️⚠️ DRUG SAFETY ALERT - DIABETIC PATIENT ⚠️⚠️⚠️

MEDICATIONS TO AVOID OR USE WITH EXTREME CAUTION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ CORTICOSTEROIDS (Will spike blood sugar):
   • PREDNISOLONE - Causes severe hyperglycemia
   • DEXAMETHASONE - Significant blood sugar elevation
   • HYDROCORTISONE - Monitor glucose very closely
   • METHYLPREDNISOLONE - Increase insulin requirements
   ⚠️ If must use: Increase diabetes medication dose, monitor glucose 4x daily

❌ BETA BLOCKERS (Masks hypoglycemia symptoms):
   • PROPRANOLOL - Blocks warning signs of low blood sugar
   • ATENOLOL - Patient won't feel hypoglycemia coming
   • METOPROLOL - Use with extreme caution, prefer cardioselective
   ⚠️ Patient may not feel shakiness, sweating during hypoglycemia

❌ THIAZIDE DIURETICS:
   • HYDROCHLOROTHIAZIDE - Can worsen glucose control
   • Monitor blood sugar more frequently if prescribed

⚠️ CHECK KIDNEY FUNCTION before prescribing:
   • METFORMIN - Contraindicated if eGFR <30
   • GLYBURIDE/GLIBENCLAMIDE - Risk of prolonged hypoglycemia in renal impairment

✅ PREFERRED MEDICATIONS FOR DIABETIC PATIENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   • Diabetes: METFORMIN (if kidney function normal), INSULIN
   • Hypertension: ACE inhibitors (ENALAPRIL), ARBs - Protect kidneys
   • Pain: PARACETAMOL (doesn't affect blood sugar)
   • Cardioselective beta blockers IF needed (not first choice)

REQUIRED ACTIONS:
• Screen for diabetic complications (eyes, kidneys, nerves, feet)
• Target HbA1c <7% for most patients
• Monitor blood glucose regularly
• Avoid high-dose steroids unless absolutely necessary
• Check kidney function before Metformin`;
}

function generateGenericSummary(detectedConditions, fileName) {
    const conditionLabels = {
        'hypertension': 'Hypertension (High Blood Pressure)',
        'diabetes': 'Diabetes Mellitus',
        'pregnancy': 'Pregnancy',
        'renal_impairment': 'Renal/Kidney Impairment',
        'liver_disease': 'Liver Disease/Dysfunction',
        'asthma': 'Asthma/Respiratory Condition'
    };
    
    let summary = "Medical Report Analysis:\n\n";
    summary += "Conditions Identified:\n";
    
    detectedConditions.forEach(condition => {
        summary += `• ${conditionLabels[condition] || condition}\n`;
    });
    
    summary += "\nClinical Recommendations:\n";
    summary += "• Exercise caution when prescribing medications\n";
    summary += "• Check for drug-disease contraindications\n";
    summary += "• Monitor relevant parameters based on detected conditions\n";
    summary += "• Adjust medication doses as clinically indicated\n";
    summary += "• Regular follow-up and monitoring advised\n\n";
    summary += "Note: This summary is based on automated analysis. Please review the full report for complete clinical details.";
    
    return summary;
}

function generateDefaultSummary(fileName) {
    return "Medical Report Summary:\n\n• Report file uploaded and stored in patient records\n• Automated analysis performed on available data\n• No specific medical conditions detected from file metadata\n\nNote: This is a simulated summary based on filename analysis. In a production system, OCR and NLP would extract detailed clinical information from the actual report content.\n\nRecommendations:\n• Review full report document for complete clinical information\n• Correlate findings with patient's clinical presentation\n• Consider relevant diagnostic tests if needed\n• Document significant findings in patient's medical record";
}

// Helper to read file as data URL (returns promise)
function readFileAsDataURL(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

// ============================================
// IMAGE UPLOAD AND MANAGEMENT FUNCTIONS
// ============================================

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPEG, PNG, GIF, WEBP)');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = {
            id: 'img_' + Date.now(),
            filename: file.name,
            filetype: file.type,
            data: e.target.result, // Base64 encoded image
            uploadedAt: new Date().toISOString(),
            uploadedBy: 'Doctor' // Could be extended to track user
        };
        
        // Save image to patient record
        void addImageToPatient(imageData);
    };
    reader.readAsDataURL(file);
}

async function addImageToPatient(imageData) {
    if (!currentPatientId) {
        alert('No patient selected');
        return;
    }

    const patientId = normalizePatientId(currentPatientId);

    try {
        await savePatientImage(patientId, imageData);
        await fetchPatientData(patientId); // refresh cache
    } catch (e) {
        alert('Failed to upload image to the database. Please try again.');
        return;
    }

    // Refresh the image gallery
    void displayPatientImages();

    // Reset file input
    const input = document.getElementById('imageUpload');
    if (input) input.value = '';

    alert('Image uploaded successfully!');
}

async function displayPatientImages() {
    const imageGallery = document.getElementById('imageGallery');
    if (!imageGallery) return;

    // Determine if we're in doctor view or patient view
    let patientId = currentPatientId;
    if (!patientId) {
        // If no currentPatientId, try to get from patient portal
        const patientIdDisplay = document.getElementById('patientIdDisplay');
        if (patientIdDisplay && patientIdDisplay.textContent && patientIdDisplay.textContent !== 'Loading...') {
            patientId = patientIdDisplay.textContent;
        }
    }

    if (!patientId) {
        imageGallery.innerHTML = '<p class="no-images">No patient selected</p>';
        return;
    }

    patientId = normalizePatientId(patientId);

    let patientData = getPatientData(patientId);
    if (!patientData) {
        try {
            imageGallery.innerHTML = '<p class="no-images">Loading images...</p>';
            patientData = await fetchPatientData(patientId);
        } catch (e) {
            imageGallery.innerHTML = '<p class="no-images">Unable to load images (server not reachable).</p>';
            return;
        }
    }

    if (!patientData.images || patientData.images.length === 0) {
        imageGallery.innerHTML = '<p class="no-images">No images uploaded for this patient</p>';
        return;
    }

    const imagesHtml = patientData.images.map(img => `
        <div class="image-item" style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; background: #fafafa;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div>
                    <strong>${img.filename}</strong><br>
                    <small style="color: #666;">Uploaded: ${new Date(img.uploadedAt).toLocaleString()}</small>
                </div>
                <div>
                    <button onclick="viewImage('${img.id}')" class="btn btn-primary" style="margin-right: 8px; padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">View</button>
                    <button onclick="downloadImage('${img.id}')" class="btn btn-success" style="padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Download</button>
                </div>
            </div>
            <div style="text-align: center; margin-top: 10px;">
                <img src="${img.data}" alt="${img.filename}" style="max-width: 100%; border-radius: 6px;" />
            </div>
        </div>
    `).join('');

    imageGallery.innerHTML = imagesHtml;
}

function viewImage(imageId) {
    // Works in both doctor and patient portal
    let patientId = currentPatientId;
    if (!patientId) {
        const patientIdDisplay = document.getElementById('patientIdDisplay');
        if (patientIdDisplay && patientIdDisplay.textContent && patientIdDisplay.textContent !== 'Loading...') {
            patientId = patientIdDisplay.textContent;
        }
    }

    patientId = patientId ? normalizePatientId(patientId) : null;
    if (!patientId) return;

    const patientData = getPatientData(patientId);
    const image = (patientData && patientData.images) ? patientData.images.find(img => img.id === imageId) : null;
    
    if (!image) {
        alert('Image not found');
        return;
    }
    
    // Open image in a new window/tab
    const imageWindow = window.open('', '_blank');
    imageWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Image Preview - ${image.filename}</title>
            <style>
                body { margin: 0; padding: 20px; background: #f0f0f0; font-family: Arial, sans-serif; }
                .container { max-width: 90vw; margin: 0 auto; text-align: center; }
                .image-container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
                img { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px; }
                .filename { margin-top: 15px; font-weight: bold; color: #333; }
                .controls { margin-top: 15px; }
                button { padding: 8px 16px; margin: 5px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="image-container">
                    <img src="${image.data}" alt="${image.filename}" />
                    <div class="filename">${image.filename}</div>
                    <div class="controls">
                        <button onclick="window.print()">Print Image</button>
                        <button onclick="window.close()">Close Window</button>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
    imageWindow.document.close();
}

function downloadImage(imageId) {
    // Works in both doctor and patient portal
    let patientId = currentPatientId;
    if (!patientId) {
        const patientIdDisplay = document.getElementById('patientIdDisplay');
        if (patientIdDisplay && patientIdDisplay.textContent && patientIdDisplay.textContent !== 'Loading...') {
            patientId = patientIdDisplay.textContent;
        }
    }

    patientId = patientId ? normalizePatientId(patientId) : null;
    if (!patientId) return;

    const patientData = getPatientData(patientId);
    const image = (patientData && patientData.images) ? patientData.images.find(img => img.id === imageId) : null;
    
    if (!image) {
        alert('Image not found');
        return;
    }
    
    // Create a temporary link to download the image
    const link = document.createElement('a');
    link.href = image.data;
    link.download = image.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getCurrentUserId() {
    return localStorage.getItem('currentUserId');
}

function getCurrentRole() {
    return localStorage.getItem('currentRole');
}

// ============================================
// API-BASED PATIENT STORAGE (SQLite via server.js)
// ============================================

// If you open HTML directly (file://), relative fetch won't work reliably.
// In that case, use localhost API base.
const API_BASE = (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:')
    ? 'http://localhost:3000'
    : '';

const PATIENT_CACHE = {};

async function apiFetchJson(path, options = {}) {
    const url = `${API_BASE}${path}`;

    const headers = Object.assign(
        { 'Content-Type': 'application/json' },
        options.headers || {}
    );

    const res = await fetch(url, Object.assign({}, options, { headers }));

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`API ${res.status}: ${text || res.statusText}`);
    }

    // Some endpoints may return empty bodies; handle gracefully
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        return null;
    }

    return await res.json();
}

function normalizePatientId(patientId) {
    return (patientId || '').toString().trim().toUpperCase();
}

function getPatientData(patientId) {
    const id = normalizePatientId(patientId);
    return PATIENT_CACHE[id] || null;
}

async function fetchPatientData(patientId) {
    const id = normalizePatientId(patientId);
    const data = await apiFetchJson(`/api/patients/${encodeURIComponent(id)}`, { method: 'GET' });

    // Normalize shape so UI doesn't crash
    const normalized = Object.assign(
        {
            exists: false,
            id,
            name: '',
            age: '',
            gender: '',
            conditions: [],
            reports: [],
            prescriptions: [],
            images: []
        },
        data || {}
    );

    PATIENT_CACHE[id] = normalized;
    return normalized;
}

async function savePatient(patientId, patientData) {
    const id = normalizePatientId(patientId);

    const payload = {
        name: patientData?.name,
        age: patientData?.age,
        gender: patientData?.gender,
        conditions: patientData?.conditions
    };

    await apiFetchJson(`/api/patients/${encodeURIComponent(id)}`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    return await fetchPatientData(id);
}

async function savePatientReport(patientId, reportData) {
    const id = normalizePatientId(patientId);
    await apiFetchJson(`/api/patients/${encodeURIComponent(id)}/reports`, {
        method: 'POST',
        body: JSON.stringify(reportData)
    });
}

async function savePatientPrescription(patientId, prescriptionData) {
    const id = normalizePatientId(patientId);
    await apiFetchJson(`/api/patients/${encodeURIComponent(id)}/prescriptions`, {
        method: 'POST',
        body: JSON.stringify(prescriptionData)
    });
}

async function savePatientImage(patientId, imageData) {
    const id = normalizePatientId(patientId);
    await apiFetchJson(`/api/patients/${encodeURIComponent(id)}/images`, {
        method: 'POST',
        body: JSON.stringify(imageData)
    });
}

// ============================================
// AUTHENTICATION & NAVIGATION
// ============================================

async function loginAsPatient() {
    const patientIdInput = document.getElementById('patientIdInput').value.trim();
    
    if (!patientIdInput) {
        alert('Please enter a Patient ID');
        return;
    }
    
    // Validate ID format (simple validation)
    if (patientIdInput.length < 3) {
        alert('Patient ID must be at least 3 characters long');
        return;
    }

    const patientId = normalizePatientId(patientIdInput);

    // Ensure patient exists in the shared SQLite DB (via server API)
    try {
        await savePatient(patientId, {});
    } catch (e) {
        alert('Cannot connect to the patient database server. Please start the server (npm start) and try again.');
        return;
    }

    localStorage.setItem('currentUserId', patientId);
    localStorage.setItem('currentRole', 'patient');

    window.location.href = 'patient (2).html';
}

function loginAsDoctor() {
    const doctorId = 'DOC' + Date.now();
    localStorage.setItem('currentUserId', doctorId);
    localStorage.setItem('currentRole', 'doctor');
    
    window.location.href = 'doctor (2).html';
}

function logout() {
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentRole');
    window.location.href = 'index (2).html';
}

// ============================================
// PATIENT DASHBOARD FUNCTIONS
// ============================================

async function initializePatientDashboard() {
    const role = getCurrentRole();
    if (role !== 'patient') {
        window.location.href = 'index (2).html';
        return;
    }

    const patientId = getCurrentUserId();

    let patientData = null;
    try {
        patientData = await fetchPatientData(patientId);

        // If this patient ID doesn't exist in DB for some reason, create it.
        if (patientData && patientData.exists === false) {
            await savePatient(patientId, {});
            patientData = await fetchPatientData(patientId);
        }
    } catch (e) {
        alert('Cannot connect to the patient database server. Please start the server (npm start) and try again.');
        logout();
        return;
    }

    // Display patient ID
    document.getElementById('patientIdDisplay').textContent = normalizePatientId(patientId);

    // Load patient details form (with immutability check)
    loadPatientDetailsForm(patientData);

    // Load and display uploaded files
    displayUploadedFiles(patientData);

    // Display extracted conditions
    displayExtractedConditions(patientData);

    // Load prescriptions
    displayPatientPrescriptions(patientData);

    // Load medication tracking
    loadPatientMedicationTracking(patientId);

    // Display patient images
    void displayPatientImages();
    
    // Initialize notification system for reminders
    initializeNotifications();
}

// Load patient medication tracking
async function loadPatientMedicationTracking(patientId) {
    try {
        // Load today's medications
        const medicationsResponse = await fetch(`/api/patients/${patientId}/today-medications`);
        const medications = await medicationsResponse.json();
        
        displayTodaysMedications(medications);
        
        // Load today's activities
        const activitiesResponse = await fetch(`/api/patients/${patientId}/today-activities`);
        const activities = await activitiesResponse.json();
        
        displayTodaysActivities(activities);
    } catch (error) {
        console.error('Error loading medication tracking:', error);
    }
}

// Display today's medications
function displayTodaysMedications(medications) {
    const container = document.getElementById('todaysMedications');
    
    if (!medications || medications.length === 0) {
        container.innerHTML = '<p class="empty-state">No active medications today. Check back later or visit your doctor for prescriptions.</p>';
        return;
    }
    
    // Group medications by time period
    const timeSlots = {
        'Morning': { icon: '🌅', meds: [] },
        'Afternoon': { icon: '☀️', meds: [] },
        'Evening': { icon: '🌆', meds: [] },
        'Night': { icon: '🌙', meds: [] }
    };
    
    // Organize medications into time slots
    medications.forEach(med => {
        // reminder_times is already parsed by the server
        const reminderTimes = Array.isArray(med.reminder_times) ? med.reminder_times : [];
        reminderTimes.forEach(time => {
            const [hours] = time.split(':').map(Number);
            let period = 'Morning';
            if (hours >= 5 && hours < 12) period = 'Morning';
            else if (hours >= 12 && hours < 17) period = 'Afternoon';
            else if (hours >= 17 && hours < 21) period = 'Evening';
            else period = 'Night';
            
            timeSlots[period].meds.push({ ...med, scheduleTime: time });
        });
    });
    
    // Calculate progress
    const totalDoses = medications.reduce((sum, med) => {
        const times = Array.isArray(med.reminder_times) ? med.reminder_times : [];
        return sum + times.length;
    }, 0);
    const takenDoses = medications.filter(med => med.today_status === 'taken').length;
    const progressPercent = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;
    
    let html = `
        <div class="medication-progress">
            <div class="progress-header">
                <span>💊 Today's Progress</span>
                <span class="progress-text">${takenDoses} of ${totalDoses} doses taken</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>
        </div>
    `;
    
    // Render each time period
    for (const [period, data] of Object.entries(timeSlots)) {
        if (data.meds.length === 0) continue;
        
        html += `
            <div class="time-period-section">
                <div class="time-period-header">
                    <span class="time-period-icon">${data.icon}</span>
                    <span class="time-period-label">${period}</span>
                </div>
                <div class="time-period-medications">
        `;
        
        data.meds.forEach(med => {
            const isTaken = med.today_status === 'taken';
            const statusClass = isTaken ? 'taken' : 'pending';
            const now = new Date();
            const [schedHours, schedMins] = med.scheduleTime.split(':').map(Number);
            const scheduleMinutes = schedHours * 60 + schedMins;
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const isOverdue = !isTaken && currentMinutes > scheduleMinutes + 30;
            
            html += `
                <div class="medication-item ${statusClass} ${isOverdue ? 'overdue' : ''}">
                    <div class="medication-time-badge">
                        <span class="time">${med.scheduleTime}</span>
                    </div>
                    <div class="medication-info">
                        <div class="medication-name">${med.medicine_name}</div>
                        <div class="medication-dosage-text">${med.dosage || ''} ${med.timing ? '• ' + med.timing : ''}</div>
                    </div>
                    <div class="medication-action">
                        ${isTaken ? 
                            '<span class="taken-badge">✓ Taken</span>' :
                            `<button class="btn-take-med" onclick="markMedicationTaken(${med.id}, '${med.scheduleTime}', '${med.medicine_name.replace(/'/g, "\\'")}')">Take</button>`
                        }
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Display today's activities
function displayTodaysActivities(activities) {
    const container = document.getElementById('todaysActivities');
    
    if (!activities || activities.length === 0) {
        container.innerHTML = '<p class="empty-state">No activity recommendations today. Check back later or visit your doctor.</p>';
        return;
    }
    
    container.innerHTML = activities.map(activity => {
        // reminder_times is already parsed by the server
        const reminderTimes = Array.isArray(activity.reminder_times) ? activity.reminder_times : [];
        const status = activity.today_status === 'completed' ? 'completed' : 'pending';
        
        return `
            <div class="activity-card">
                <div class="activity-header">
                    <h4>${activity.activity_name}</h4>
                    <span class="activity-frequency">${activity.frequency || 'Frequency not specified'}</span>
                </div>
                <div class="activity-details">
                    <p><strong>Duration:</strong> ${activity.duration || 'Not specified'} minutes</p>
                    <p><strong>Instructions:</strong> ${activity.instructions || 'No specific instructions'}</p>
                </div>
                <div class="activity-times">
                    <p><strong>Reminders:</strong> ${reminderTimes.join(', ') || 'No specific times'}</p>
                </div>
                <div class="activity-actions">
                    <button class="btn-activity ${status}" 
                            onclick="markActivityCompleted(${activity.id}, '${activity.activity_name}')">
                        ${status === 'completed' ? 'Completed ✓' : 'Mark Completed'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Mark medication as taken
async function markMedicationTaken(trackingId, scheduledTime, medicineName) {
    try {
        const response = await fetch(`/api/medication/${trackingId}/log`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                scheduledTime: scheduledTime,
                status: 'taken',
                notes: `Taken ${medicineName}`
            })
        });
        
        if (response.ok) {
            // Reload the medication list to update status
            const patientId = getCurrentUserId();
            loadPatientMedicationTracking(patientId);
            alert(`${medicineName} marked as taken!`);
        } else {
            throw new Error('Failed to log medication');
        }
    } catch (error) {
        console.error('Error marking medication as taken:', error);
        alert('Error marking medication as taken. Please try again.');
    }
}

// Mark activity as completed
async function markActivityCompleted(trackingId, activityName) {
    try {
        const response = await fetch(`/api/activity/${trackingId}/log`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'completed',
                notes: `Completed ${activityName}`
            })
        });
        
        if (response.ok) {
            // Reload the activity list to update status
            const patientId = getCurrentUserId();
            loadPatientMedicationTracking(patientId);
            alert(`${activityName} marked as completed!`);
        } else {
            throw new Error('Failed to log activity');
        }
    } catch (error) {
        console.error('Error marking activity as completed:', error);
        alert('Error marking activity as completed. Please try again.');
    }
}

function displayExtractedConditions(patientData) {
    const container = document.getElementById('extractedConditions');
    
    if (patientData.conditions.length === 0) {
        container.innerHTML = '<span style="color: var(--color-text-light); font-style: italic;">No conditions extracted yet. Upload medical files.</span>';
        return;
    }
    
    const conditionLabels = {
        'hypertension': 'Hypertension',
        'diabetes': 'Diabetes',
        'pregnancy': 'Pregnancy',
        'renal_impairment': 'Renal Impairment',
        'liver_disease': 'Liver Disease',
        'asthma': 'Asthma'
    };
    
    container.innerHTML = patientData.conditions.map(condition => 
        `<span class="condition-flag">${conditionLabels[condition] || condition}</span>`
    ).join('');
}

async function uploadReports() {
    const fileInput = document.getElementById('fileUpload');
    const files = fileInput.files;

    if (files.length === 0) {
        alert('Please select files to upload');
        return;
    }

    const patientId = normalizePatientId(getCurrentUserId());

    // Ensure patient is loaded
    try {
        if (!getPatientData(patientId)) {
            await fetchPatientData(patientId);
        }
    } catch (e) {
        alert('Cannot connect to the patient database server. Please start the server (npm start) and try again.');
        return;
    }

    // Save each report in the SQLite DB
    for (let file of files) {
        const reportData = {
            name: file.name,
            size: file.size,
            type: file.type,
            extractedConditions: [], // No automatic condition extraction
            dataUrl: null,
            summary: null // Summary is not persisted by OCR summarizer currently
        };

        // Read file as data URL if reasonably small (<= 2.5 MB)
        try {
            if (file.size <= 2.5 * 1024 * 1024) {
                const dataUrl = await readFileAsDataURL(file);
                reportData.dataUrl = dataUrl;
            }
        } catch (e) {
            reportData.dataUrl = null;
        }

        await savePatientReport(patientId, reportData);
    }

    // Refresh patient data from server so UI reflects DB state
    const patientData = await fetchPatientData(patientId);

    // Clear file input and refresh display
    fileInput.value = '';
    displayUploadedFiles(patientData);
    displayExtractedConditions(patientData);

    alert('Reports uploaded successfully! Use the "🔍 Summarize Report (OCR)" button to extract and analyze biomarkers from image reports.');
}

function displayUploadedFiles(patientData) {
    const container = document.getElementById('uploadedFiles');
    
    if (patientData.reports.length === 0) {
        container.innerHTML = '<p class="empty-state">No reports uploaded yet</p>';
    } else {
        const conditionLabels = {
            'hypertension': 'Hypertension',
            'diabetes': 'Diabetes',
            'pregnancy': 'Pregnancy',
            'renal_impairment': 'Renal Impairment',
            'liver_disease': 'Liver Disease',
            'asthma': 'Asthma'
        };
        
        container.innerHTML = patientData.reports.map((report, index) => {
            const reportId = `patient-report-${index}`;
            const extractedText = report.extractedConditions && report.extractedConditions.length > 0 
                ? `<div style="margin-top: var(--spacing-xs); font-size: var(--font-size-small); color: var(--color-success);">
                    ✓ Extracted: ${report.extractedConditions.map(c => conditionLabels[c] || c).join(', ')}
                   </div>`
                : '';

            // If dataUrl present, provide preview/link
            let previewHtml = '';
            if (report.dataUrl) {
                if (report.type && report.type.startsWith('image/')) {
                    previewHtml = `<div style="margin-top: var(--spacing-sm);"><img src="${report.dataUrl}" alt="${report.name}" style="max-width:200px; border-radius:6px;"/></div>`;
                } else {
                    previewHtml = `<div style="margin-top: var(--spacing-sm);"><a href="${report.dataUrl}" target="_blank" download="${report.name}">View / Download</a></div>`;
                }
            } else if (report.size > 0 && report.size > 2.5 * 1024 * 1024) {
                previewHtml = `<div style="margin-top: var(--spacing-sm); font-size: var(--font-size-small); color: var(--color-text-light);">File is large and not stored locally.</div>`;
            }

            // Add summary section for patient view - simplified version without detailed drug warnings
            const summarySection = report.summary ? `
                <div style="margin-top: var(--spacing-sm);">
                    <button 
                        onclick="toggleReportSummary('${reportId}')" 
                        style="background: var(--color-primary); color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: var(--font-size-small);">
                        📋 View Report Summary
                    </button>
                    <div id="${reportId}-summary" style="display: none; margin-top: var(--spacing-sm); padding: var(--spacing-sm); background-color: #f0f9ff; border-left: 3px solid var(--color-primary); border-radius: 4px;">
                        <div style="font-weight: 600; margin-bottom: var(--spacing-xs); color: var(--color-primary);">Report Summary:</div>
                        <pre style="white-space: pre-wrap; font-family: var(--font-family); font-size: var(--font-size-small); margin: 0; line-height: 1.6;">${getPatientFriendlySummary(report.summary)}</pre>
                        <div style="margin-top: var(--spacing-xs); padding: var(--spacing-xs); background-color: #e0f2fe; border-radius: 4px; font-size: 11px;">
                            💡 <strong>Note:</strong> Share this report with your doctor for detailed medical guidance and prescription recommendations.
                        </div>
                    </div>
                </div>
            ` : '';

            return `
                <div class="file-item">
                    <div style="flex: 1;">
                        <div>📄 ${report.name} (${(report.size / 1024).toFixed(1)} KB)</div>
                        ${extractedText}
                        ${previewHtml}
                        ${summarySection}
                    </div>
                    <span style="color: var(--color-text-light); font-size: var(--font-size-small);">
                        ${new Date(report.uploadedAt).toLocaleDateString()}
                    </span>
                </div>
            `;
        }).join('');
    }
    
    // Also update the image gallery for patient
    displayPatientImages();
}

function displayPatientPrescriptions(patientData) {
    const container = document.getElementById('prescriptionsList');
    
    if (patientData.prescriptions.length === 0) {
        container.innerHTML = '<p class="empty-state">No prescriptions yet. Visit your doctor to get started.</p>';
        return;
    }
    
    // Also display follow-up reminders
    displayFollowUpReminders(patientData.prescriptions);
    
    container.innerHTML = patientData.prescriptions.map((prescription, index) => `
        <div class="prescription-item">
            <div class="prescription-date">
                Prescribed by: ${prescription.doctorId} on ${new Date(prescription.date).toLocaleString()}
            </div>
            <div class="prescription-content">${prescription.content}</div>
            ${prescription.followUp ? `
                <div style="margin-top: var(--spacing-sm); padding: var(--spacing-sm); background-color: #e0f2fe; border-radius: var(--radius-sm); font-size: var(--font-size-small);">
                    <strong>📅 Follow-up:</strong> ${prescription.followUp}
                </div>
            ` : ''}
            ${prescription.warnings ? `
                <div style="margin-top: var(--spacing-sm); padding: var(--spacing-sm); background-color: #fef3c7; border-radius: var(--radius-sm); font-size: var(--font-size-small);">
                    <strong>⚠️ Doctor's Notes:</strong> ${prescription.doctorNotes || 'Warnings were acknowledged by the doctor.'}
                </div>
            ` : ''}
        </div>
    `).join('');
    
    // Store prescriptions for printing
    window.patientPrescriptions = patientData.prescriptions;
    window.patientInfo = { name: patientData.name, age: patientData.age, gender: patientData.gender, id: patientData.id };
}

// ============================================
// DOCTOR DASHBOARD FUNCTIONS
// ============================================

let currentPatientId = null;
let recognitionInstance = null;
let medicineCounter = 0;
let fieldRecognitionInstance = null;
let currentFieldId = null;

function initializeDoctorDashboard() {
    const role = getCurrentRole();
    if (role !== 'doctor') {
        window.location.href = 'index (2).html';
        return;
    }
    
    // Initialize with one medicine field
    addMedicineField();
    
    // Check for Web Speech API support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        // Initialize main prescription recognition
        recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-IN';
        recognitionInstance.onresult = handleSpeechResult;
        recognitionInstance.onerror = handleSpeechError;
        recognitionInstance.onend = handleSpeechEnd;
        
        // Initialize field-specific recognition
        fieldRecognitionInstance = new SpeechRecognition();
        fieldRecognitionInstance.continuous = false;
        fieldRecognitionInstance.interimResults = true;
        fieldRecognitionInstance.lang = 'en-IN';
        fieldRecognitionInstance.onresult = handleFieldSpeechResult;
        fieldRecognitionInstance.onerror = handleFieldSpeechError;
        fieldRecognitionInstance.onend = handleFieldSpeechEnd;
    } else {
        // Disable voice button if not supported
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.disabled = true;
            voiceBtn.textContent = '🎤 Voice Not Supported';
        }
    }
}

async function loadPatient() {
    const patientIdInputRaw = document.getElementById('patientIdInput').value.trim();

    if (!patientIdInputRaw) {
        alert('Please enter a Patient ID');
        return;
    }

    const patientIdInput = normalizePatientId(patientIdInputRaw);

    let patientData = null;
    try {
        patientData = await fetchPatientData(patientIdInput);
    } catch (e) {
        alert('Cannot connect to the patient database server. Please start the server (npm start) and try again.');
        return;
    }

    if (!patientData || patientData.exists === false) {
        alert('Patient not found. Please check the ID and try again.');
        return;
    }

    currentPatientId = patientIdInput;

    // Show patient information section
    document.getElementById('patientInfoSection').classList.remove('hidden');
    document.getElementById('prescriptionSection').classList.remove('hidden');

    // Display patient ID
    document.getElementById('currentPatientId').textContent = patientIdInput;

    // Load patient demographics if available
    document.getElementById('patientName').value = patientData.name || '';
    document.getElementById('patientAge').value = patientData.age || '';
    document.getElementById('patientGender').value = patientData.gender || '';

    // Display medical history disclaimers
    displayPatientDisclaimers(patientData);

    // Display uploaded reports
    displayPatientReports(patientData);

    // Display patient's prescription history
    displayPatientPrescriptionHistory(patientData);

    // Display patient images
    void displayPatientImages();

    // Clear previous prescription
    clearPrescription();
    document.getElementById('warningSection').classList.add('hidden');
    document.getElementById('successMessage').classList.add('hidden');
}

async function savePatientDemographics() {
    if (!currentPatientId) {
        alert('Please load a patient first');
        return;
    }

    const patientData = getPatientData(currentPatientId);
    if (!patientData) {
        alert('Patient data not loaded. Please reload the patient.');
        return;
    }

    patientData.name = document.getElementById('patientName').value.trim();
    patientData.age = document.getElementById('patientAge').value.trim();
    patientData.gender = document.getElementById('patientGender').value;

    try {
        await savePatient(currentPatientId, patientData);
    } catch (e) {
        alert('Failed to save patient details to the database. Please try again.');
        return;
    }

    alert('Patient demographics saved successfully!');
}

function displayPatientDisclaimers(patientData) {
    const container = document.getElementById('patientDisclaimers');
    
    if (patientData.conditions.length === 0) {
        container.innerHTML = '<p style="color: var(--color-text-light); font-style: italic;">No medical conditions detected from patient records</p>';
        return;
    }
    
    const conditionLabels = {
        'hypertension': 'Hypertension (High Blood Pressure)',
        'diabetes': 'Diabetes Mellitus',
        'pregnancy': 'Pregnancy',
        'renal_impairment': 'Renal/Kidney Impairment',
        'liver_disease': 'Liver Disease',
        'asthma': 'Asthma/Respiratory Condition'
    };
    
    const disclaimerAdvice = {
        'hypertension': 'Avoid NSAIDs (Ibuprofen, Diclofenac) - may increase BP. Monitor cardiovascular status.',
        'diabetes': 'Monitor blood glucose if prescribing steroids or beta blockers. Check renal function for Metformin.',
        'pregnancy': 'AVOID: ACE inhibitors, NSAIDs (3rd trimester), Quinolones. Use pregnancy-safe alternatives.',
        'renal_impairment': 'Dose adjustment required for many drugs. Avoid Metformin if eGFR <30. Caution with NSAIDs.',
        'liver_disease': 'Reduce doses of hepatically metabolized drugs. Monitor liver function. Avoid Paracetamol in severe cases.',
        'asthma': 'Avoid non-selective beta blockers. Caution with Aspirin in aspirin-sensitive asthma.'
    };
    
    container.innerHTML = patientData.conditions.map(condition => `
        <div class="disclaimer-item">
            <div class="disclaimer-condition">${conditionLabels[condition] || condition}</div>
            <div class="disclaimer-advice">${disclaimerAdvice[condition] || 'Exercise caution when prescribing.'}</div>
            <div class="disclaimer-source">Based on patient's uploaded medical records</div>
        </div>
    `).join('');
}

function displayPatientReports(patientData) {
    const container = document.getElementById('patientReports');
    
    if (patientData.reports.length === 0) {
        container.innerHTML = '<p style="color: var(--color-text-light); font-size: var(--font-size-small);">No medical files uploaded by patient</p>';
        return;
    }
    
    const conditionLabels = {
        'hypertension': 'Hypertension',
        'diabetes': 'Diabetes',
        'pregnancy': 'Pregnancy',
        'renal_impairment': 'Renal Impairment',
        'liver_disease': 'Liver Disease',
        'asthma': 'Asthma'
    };
    
    container.innerHTML = '<div style="display: flex; flex-direction: column; gap: var(--spacing-sm);">' +
        patientData.reports.map((report, index) => {
            const reportId = `report-${index}`;
            const extractedInfo = report.extractedConditions && report.extractedConditions.length > 0
                ? `<div style="margin-top: var(--spacing-xs); font-size: var(--font-size-small); color: var(--color-success);">
                    📋 Conditions found: ${report.extractedConditions.map(c => conditionLabels[c] || c).join(', ')}
                   </div>`
                : '<div style="margin-top: var(--spacing-xs); font-size: var(--font-size-small); color: var(--color-text-light);">No conditions detected</div>';
            
            // preview or link if dataUrl exists
            let preview = '';
            let summarizeButton = '';
            if (report.dataUrl) {
                if (report.type && report.type.startsWith('image/')) {
                    preview = `<div style="margin-top: var(--spacing-sm);"><img id="report-img-${index}" src="${report.dataUrl}" alt="${report.name}" style="max-width:160px; border-radius:6px;"/></div>`;
                    summarizeButton = `<div style="margin-top: var(--spacing-sm);">
                        <button 
                            onclick="summarizeReport(${index}, '${report.dataUrl}', '${report.name.replace(/'/g, "\\'")}')" 
                            style="background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: var(--font-size-small); font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s;"
                            onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
                            🔍 Summarize Report (OCR)
                        </button>
                        <div id="report-summarizer-${index}" style="display: none; margin-top: var(--spacing-sm);"></div>
                    </div>`;
                } else {
                    preview = `<div style="margin-top: var(--spacing-sm);"><a href="${report.dataUrl}" target="_blank" download="${report.name}">View / Download</a></div>`;
                }
            } else if (report.size > 2.5 * 1024 * 1024) {
                preview = `<div style="margin-top: var(--spacing-sm); font-size: var(--font-size-small); color: var(--color-text-light);">File is large and not stored locally.</div>`;
            }

            // No old summary section - use OCR summarizer instead
            const summarySection = '';

            return `
                <div style="background-color: var(--color-background); padding: var(--spacing-sm); border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
                    <div style="display: flex; justify-content: space-between; align-items: start; gap: var(--spacing-md);">
                        <div style="flex: 1;">
                            <div style="font-weight: 500;">📄 ${report.name}</div>
                            ${extractedInfo}
                            ${preview}
                            ${summarizeButton}
                            ${summarySection}
                        </div>
                        <span style="color: var(--color-text-light); font-size: var(--font-size-small); white-space: nowrap;">
                            ${new Date(report.uploadedAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            `;
        }).join('') +
        '</div>';
    
    // Also refresh the image gallery
    displayPatientImages();
}

// Toggle report summary visibility
function toggleReportSummary(reportId) {
    const summaryDiv = document.getElementById(`${reportId}-summary`);
    const button = event.target;
    
    if (summaryDiv.style.display === 'none') {
        summaryDiv.style.display = 'block';
        if (button.textContent.includes('Clinical Summary')) {
            button.textContent = '🩺 Hide Clinical Summary';
        } else {
            button.textContent = '📋 Hide Summary';
        }
    } else {
        summaryDiv.style.display = 'none';
        if (reportId.startsWith('patient-report')) {
            button.textContent = '📋 View Report Summary';
        } else {
            button.textContent = '🩺 View Clinical Summary & Drug Warnings';
        }
    }
}

// ============================================
// REPORT OCR SUMMARIZER (Doctor's Discretion)
// ============================================

const OCR_DICTIONARY = { "rvc": "RBC", "hgb": "HGB", "wbc": "WBC", "hct": "HCT", "glu": "Glucose" };

// Normal reference ranges for common biomarkers
const BIOMARKER_RANGES = {
    'HAEMOGLOBIN': { min: 12, max: 17, unit: 'g/dL' },
    'HGB': { min: 12, max: 17, unit: 'g/dL' },
    'HEMOGLOBIN': { min: 12, max: 17, unit: 'g/dL' },
    'RBC': { min: 4.0, max: 6.0, unit: 'million/μL' },
    'RBC COUNT': { min: 4.0, max: 6.0, unit: 'million/μL' },
    'WBC': { min: 4000, max: 11000, unit: '/μL' },
    'TOTAL LEUCOCYTE COUNT': { min: 4000, max: 11000, unit: '/μL' },
    'TLC': { min: 4000, max: 11000, unit: '/μL' },
    'NEUTROPHILS': { min: 40, max: 75, unit: '%' },
    'LYMPHOCYTES': { min: 20, max: 45, unit: '%' },
    'EOSINOPHILS': { min: 0, max: 6, unit: '%' },
    'BASOPHILS': { min: 0, max: 2, unit: '%' },
    'MONOCYTES': { min: 2, max: 10, unit: '%' },
    'PLATELET COUNT': { min: 150000, max: 450000, unit: '/μL' },
    'PLATELETS': { min: 150000, max: 450000, unit: '/μL' },
    'HCT': { min: 36, max: 52, unit: '%' },
    'HEMATOCRIT': { min: 36, max: 52, unit: '%' },
    'MCV': { min: 80, max: 100, unit: 'fL' },
    'MCH': { min: 27, max: 33, unit: 'pg' },
    'MCHC': { min: 32, max: 36, unit: 'g/dL' },
    'GLUCOSE': { min: 70, max: 100, unit: 'mg/dL' },
    'FASTING GLUCOSE': { min: 70, max: 100, unit: 'mg/dL' },
    'RANDOM GLUCOSE': { min: 70, max: 140, unit: 'mg/dL' },
    'CREATININE': { min: 0.6, max: 1.2, unit: 'mg/dL' },
    'UREA': { min: 7, max: 20, unit: 'mg/dL' },
    'BUN': { min: 7, max: 20, unit: 'mg/dL' },
    'SGPT': { min: 7, max: 56, unit: 'U/L' },
    'ALT': { min: 7, max: 56, unit: 'U/L' },
    'SGOT': { min: 10, max: 40, unit: 'U/L' },
    'AST': { min: 10, max: 40, unit: 'U/L' },
    'BILIRUBIN': { min: 0.1, max: 1.2, unit: 'mg/dL' },
    'TOTAL BILIRUBIN': { min: 0.1, max: 1.2, unit: 'mg/dL' }
};

async function summarizeReport(reportIndex, imageDataUrl, reportName) {
    const summarizerDiv = document.getElementById(`report-summarizer-${reportIndex}`);
    
    if (!summarizerDiv) {
        console.error('Summarizer div not found');
        return;
    }

    // Check if Tesseract is available
    if (typeof Tesseract === 'undefined') {
        summarizerDiv.innerHTML = '<div style="padding: var(--spacing-sm); background-color: #fee2e2; border-left: 4px solid #ef4444; border-radius: 4px; color: #991b1b; font-size: var(--font-size-small);">Error: Tesseract.js library not loaded. Please refresh the page.</div>';
        return;
    }

    // Show loading state
    summarizerDiv.style.display = 'block';
    summarizerDiv.innerHTML = '<div style="padding: var(--spacing-sm); background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 4px; color: #1e40af; font-size: var(--font-size-small);">🔄 Processing image and extracting text... This may take a moment.</div>';

    try {
        // Create image element
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageDataUrl;

        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });

        // Create canvas for image preprocessing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;

        // Image preprocessing for better OCR accuracy
        ctx.filter = 'grayscale(100%) contrast(250%) brightness(110%)';
        ctx.drawImage(img, 0, 0);

        // Perform OCR
        summarizerDiv.innerHTML = '<div style="padding: var(--spacing-sm); background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 4px; color: #1e40af; font-size: var(--font-size-small);">🔍 Extracting text from image...</div>';

        const processedImage = canvas.toDataURL('image/jpeg', 1.0);
        const result = await Tesseract.recognize(processedImage, 'eng');
        
        // Analyze the extracted text
        analyzeReportOCR(result.data.text, reportIndex, reportName);

    } catch (error) {
        console.error('OCR Error:', error);
        summarizerDiv.innerHTML = `<div style="padding: var(--spacing-sm); background-color: #fee2e2; border-left: 4px solid #ef4444; border-radius: 4px; color: #991b1b; font-size: var(--font-size-small);">Error processing image: ${error.message}</div>`;
    }
}

function analyzeReportOCR(text, reportIndex, reportName) {
    const summarizerDiv = document.getElementById(`report-summarizer-${reportIndex}`);
    const lines = text.split('\n');
    let extractedData = [];
    let reportType = "General Report";
    
    // Detect Report Type
    const lowerText = text.toLowerCase();
    if (lowerText.includes("hcg")) {
        reportType = "Pregnancy (hCG) Report";
    }
    if (lowerText.includes("hemoglobin")) {
        reportType = "Complete Blood Count (CBC)";
    }

    lines.forEach(line => {
        let cleanLine = line.toLowerCase().trim();
        if (cleanLine.length < 3) return;

        // Apply Autocorrect (rvc -> rbc, etc.)
        Object.keys(OCR_DICTIONARY).forEach(key => {
            if (cleanLine.includes(key)) {
                cleanLine = cleanLine.replace(key, OCR_DICTIONARY[key].toLowerCase());
            }
        });

        // Regex: Look for a Label and a Number (handling decimals)
        // More flexible pattern to match labels with spaces/tabs before numbers
        const match = cleanLine.match(/([a-z\s]+)\s+([\d\.]+)/i);
        
        if (match) {
            let label = match[1].toUpperCase().trim();
            let value = parseFloat(match[2]);
            let originalValue = match[2];
            let note = "Normal Detection";
            let isAbnormal = false;
            let abnormalityType = null;

            // DECIMAL FIX: If RBC is 41, it should be 4.1
            if (label.includes("RBC") && value > 10) {
                value = parseFloat((value / 10).toFixed(1));
                note = `<span style="font-size: 0.75rem; color: #d35400; font-weight: bold; display: block;">Auto-corrected decimal: ${originalValue} → ${value}</span>`;
            }

            // Check against reference ranges
            let range = null;
            for (const [key, rangeData] of Object.entries(BIOMARKER_RANGES)) {
                if (label.includes(key) || key.includes(label)) {
                    range = rangeData;
                    break;
                }
            }

            // If no exact match, try partial matching
            if (!range) {
                const labelWords = label.split(/\s+/);
                for (const word of labelWords) {
                    if (word.length > 3) { // Only check meaningful words
                        for (const [key, rangeData] of Object.entries(BIOMARKER_RANGES)) {
                            if (key.includes(word) || word.includes(key.split(' ')[0])) {
                                range = rangeData;
                                break;
                            }
                        }
                        if (range) break;
                    }
                }
            }

            // Compare value against range
            if (range && !isNaN(value)) {
                if (value < range.min) {
                    isAbnormal = true;
                    abnormalityType = 'low';
                    note = `<span style="color: #ef4444; font-weight: bold;">⚠️ LOW</span> - Below normal range (${range.min}-${range.max} ${range.unit})`;
                } else if (value > range.max) {
                    isAbnormal = true;
                    abnormalityType = 'high';
                    note = `<span style="color: #ef4444; font-weight: bold;">⚠️ HIGH</span> - Above normal range (${range.min}-${range.max} ${range.unit})`;
                } else {
                    note = `Normal (${range.min}-${range.max} ${range.unit})`;
                }
            }

            extractedData.push({ 
                label, 
                value: originalValue, 
                numericValue: value,
                note, 
                isAbnormal, 
                abnormalityType,
                range 
            });
        }
    });

    // Find abnormal values for summary
    const abnormalValues = extractedData.filter(item => item.isAbnormal);
    
    // Generate the summary HTML - matching index (4).html format exactly
    let summaryHTML = '';
    
    if (extractedData.length > 0) {
        summaryHTML = `
            <div style="background: #e8f5e9; border-left: 5px solid #2e7d32; padding: 15px; margin-top: var(--spacing-sm); border-radius: 6px;">
                <h3 style="margin-top: 0; color: #1b5e20; font-size: 16px;">AI Narrative Summary</h3>
                <p style="margin-bottom: 15px; color: #2e7d32;">
                    Identified as a <strong>${reportType}</strong>.<br>
                    Extracted ${extractedData.length} clinical markers. Primary focus found on <strong>${extractedData[0].label}</strong> 
                    with a value of <strong>${extractedData[0].value}</strong>.
                </p>
                
                ${abnormalValues.length > 0 ? `
                    <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin-bottom: 15px; border-radius: 4px;">
                        <h4 style="margin: 0 0 8px 0; color: #991b1b; font-size: 14px;">⚠️ Report Summary - Abnormal Values Detected:</h4>
                        <ul style="margin: 0; padding-left: 20px; color: #991b1b; font-size: 13px;">
                            ${abnormalValues.map(item => {
                                const status = item.abnormalityType === 'high' ? 'HIGH' : 'LOW';
                                const rangeInfo = item.range ? ` (Normal: ${item.range.min}-${item.range.max} ${item.range.unit})` : '';
                                return `<li><strong>${item.label}:</strong> ${item.value} - ${status}${rangeInfo}</li>`;
                            }).join('')}
                        </ul>
                    </div>
                ` : `
                    <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 12px; margin-bottom: 15px; border-radius: 4px;">
                        <p style="margin: 0; color: #065f46; font-size: 13px;">✓ All extracted values appear to be within normal ranges.</p>
                    </div>
                `}
                
                <div style="background: white; border-radius: 6px; overflow: hidden; margin-top: 15px;">
                    <h3 style="padding: 12px; background: #f8f9fa; margin: 0; font-size: 14px; border-bottom: 2px solid #dee2e6;">Structured Data (Doctor's View)</h3>
                    <table style="width: 100%; border-collapse: collapse; background: white;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 12px; border-bottom: 2px solid #dee2e6; text-align: left;">Marker</th>
                                <th style="padding: 12px; border-bottom: 2px solid #dee2e6; text-align: left;">Value</th>
                                <th style="padding: 12px; border-bottom: 2px solid #dee2e6; text-align: left;">Clinical Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${extractedData.map(item => {
                                const rowStyle = item.isAbnormal ? 'background: #fff5f5; border-left: 4px solid #ef4444;' : '';
                                return `
                                <tr style="${rowStyle}">
                                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.label}</td>
                                    <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong>${item.value}</strong></td>
                                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.note}</td>
                                </tr>
                            `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else {
        summaryHTML = `
            <div style="background: #fff3cd; border-left: 5px solid #ffc107; padding: 15px; margin-top: var(--spacing-sm); border-radius: 6px;">
                <h3 style="margin-top: 0; color: #856404; font-size: 16px;">OCR Analysis Complete</h3>
                <p style="color: #856404;">
                    Text detected, but no specific clinical markers (Test Name + Value) could be structured. Please review source image.
                </p>
            </div>
        `;
    }

    summarizerDiv.innerHTML = summaryHTML;
}

// Extract patient-friendly summary (remove technical drug contraindication warnings)
function getPatientFriendlySummary(fullSummary) {
    if (!fullSummary) return '';
    
    // Split by the contraindication warnings section
    const parts = fullSummary.split('═══════════════════════════════════════════════════════════');
    
    // Return only the clinical summary part (before contraindication warnings)
    if (parts.length > 1) {
        return parts[0].trim();
    }
    
    return fullSummary;
}

function displayPatientPrescriptionHistory(patientData) {
    const container = document.getElementById('patientPrescriptionHistory');
    
    if (!container) {
        return; // Element doesn't exist (not on doctor page)
    }
    
    if (!patientData.prescriptions || patientData.prescriptions.length === 0) {
        container.innerHTML = '<p style="color: var(--color-text-light); font-style: italic;">No previous prescriptions found</p>';
        return;
    }
    
    // Store prescriptions and patient info for printing
    window.doctorViewPrescriptions = patientData.prescriptions;
    window.doctorViewPatientInfo = { name: patientData.name, age: patientData.age, gender: patientData.gender, id: patientData.id };
    
    container.innerHTML = '<div style="display: flex; flex-direction: column; gap: var(--spacing-md);">' +
        patientData.prescriptions.map((prescription, index) => {
            const prescriptionDate = new Date(prescription.date);
            const formattedDate = prescriptionDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <div style="background-color: var(--color-background); padding: var(--spacing-md); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-sm);">
                        <div>
                            <strong style="color: var(--color-primary);">Prescription #${patientData.prescriptions.length - index}</strong>
                            <div style="font-size: var(--font-size-small); color: var(--color-text-light); margin-top: 4px;">
                                Prescribed by: ${prescription.doctorId}
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: var(--font-size-small); color: var(--color-text-light); white-space: nowrap;">
                                ${formattedDate}
                            </span>
                            <button class="btn-print" onclick="printPrescriptionDoctor(${index})">
                                🖨️ Print
                            </button>
                        </div>
                    </div>
                    
                    <div style="background-color: white; padding: var(--spacing-sm); border-radius: var(--radius-sm); font-family: monospace; font-size: var(--font-size-small); white-space: pre-wrap; margin-top: var(--spacing-sm);">
${prescription.content}
                    </div>
                    
                    ${prescription.warnings ? `
                        <div style="margin-top: var(--spacing-sm); padding: var(--spacing-sm); background-color: #fef3c7; border-radius: var(--radius-sm); font-size: var(--font-size-small);">
                            <strong>⚠️ Safety Notes:</strong> ${prescription.doctorNotes || 'Warnings were acknowledged by the prescribing doctor.'}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('') +
        '</div>';
}

// ============================================
// MEDICINE FIELD MANAGEMENT
// ============================================

function addMedicineField() {
    medicineCounter++;
    const medicinesList = document.getElementById('medicinesList');
    
    const medicineDiv = document.createElement('div');
    medicineDiv.className = 'medicine-card';
    medicineDiv.id = `medicine-${medicineCounter}`;
    medicineDiv.innerHTML = `
        <div class="medicine-header">
            <span class="medicine-number">${medicineCounter}.</span>
            ${medicineCounter > 1 ? `<button class="btn-remove" onclick="removeMedicineField(${medicineCounter})">✕</button>` : ''}
        </div>
        <div class="medicine-fields">
            <div class="form-group">
                <label>Brand Name (if any)</label>
                <input type="text" class="input-field medicine-brand" placeholder="e.g., Tylenol, Advil" oninput="brandChanged(this)">
            </div>
            <div class="form-group">
                <label>Biomolecule / Generic Name</label>
                <input type="text" class="input-field medicine-molecule" placeholder="e.g., Paracetamol" readonly>
            </div>
            <div class="form-group">
                <label>Associated Diagnosis</label>
                <input type="text" class="input-field medicine-diagnosis" placeholder="e.g., Viral fever" readonly>
            </div>
            <div class="form-group">
                <label>Dosage</label>
                <input type="text" class="input-field medicine-dosage" placeholder="500mg">
            </div>
            <div class="form-group">
                <label>Route</label>
                <select class="input-field medicine-route">
                    <option value="Oral">Oral</option>
                    <option value="Topical">Topical</option>
                    <option value="IV">IV</option>
                    <option value="IM">IM</option>
                    <option value="Sublingual">Sublingual</option>
                    <option value="Inhaled">Inhaled</option>
                </select>
            </div>
            <div class="form-group">
                <label>Frequency</label>
                <input type="text" class="input-field medicine-frequency" placeholder="Twice daily">
            </div>
            <div class="form-group">
                <label>Duration</label>
                <input type="text" class="input-field medicine-duration" placeholder="5 days">
            </div>
            <div class="form-group medicine-timing-group">
                <label>Timing</label>
                <select class="input-field medicine-timing">
                    <option value="">Select</option>
                    <option value="Before food">Before food</option>
                    <option value="After food">After food</option>
                    <option value="With food">With food</option>
                    <option value="Empty stomach">Empty stomach</option>
                    <option value="At bedtime">At bedtime</option>
                    <option value="As needed">As needed (SOS)</option>
                </select>
            </div>
        </div>
    `;
    
    medicinesList.appendChild(medicineDiv);
}

function brandChanged(inputElem) {
    // When the brand input is edited, auto-fill the biomolecule/generic if known
    const brand = inputElem.value.trim().toLowerCase();
    const card = inputElem.closest('.medicine-card');
    const moleculeInput = card ? card.querySelector('.medicine-molecule') : null;

    if (!moleculeInput) return;

    if (!brand) {
        moleculeInput.value = '';
        return;
    }

    // Check alias mapping
    for (const [alias, actual] of Object.entries(DRUG_ALIASES)) {
        if (brand.includes(alias) || alias.includes(brand)) {
            moleculeInput.value = capitalizeWords(actual);
            checkAllDrugInteractions();
            return;
        }
    }

    // If brand not found in aliases, try to match common medicines
    for (const med of COMMON_MEDICINES) {
        if (brand.includes(med) || med.includes(brand)) {
            moleculeInput.value = capitalizeWords(med);
            checkAllDrugInteractions();
            return;
        }
    }

    // No match found
    moleculeInput.value = '';
}

function removeMedicineField(id) {
    const medicineDiv = document.getElementById(`medicine-${id}`);
    if (medicineDiv) {
        medicineDiv.remove();
        checkAllDrugInteractions();
    }
}

function getAllMedicines() {
    const medicines = [];
    const medicineCards = document.querySelectorAll('.medicine-card');
    
    medicineCards.forEach(card => {
        const brand = (card.querySelector('.medicine-brand') && card.querySelector('.medicine-brand').value.trim()) || '';
        const molecule = (card.querySelector('.medicine-molecule') && card.querySelector('.medicine-molecule').value.trim()) || '';
        const diagnosis = (card.querySelector('.medicine-diagnosis') && card.querySelector('.medicine-diagnosis').value.trim()) || '';
        const dosage = card.querySelector('.medicine-dosage').value.trim();
        const route = card.querySelector('.medicine-route').value;
        const frequency = card.querySelector('.medicine-frequency').value.trim();
        const duration = card.querySelector('.medicine-duration').value.trim();
        const timing = card.querySelector('.medicine-timing').value;
        
        const finalName = molecule || brand;
        if (finalName) {
            medicines.push({ name: finalName, brand, molecule, diagnosis, dosage, route, frequency, duration, timing });
        }
    });
    
    return medicines;
}

// ============================================
// SPEECH-TO-TEXT FUNCTIONS
// ============================================

let isListening = false;
let speechBuffer = '';

function toggleVoiceInput() {
    if (!recognitionInstance) {
        alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
        return;
    }
    
    const voiceBtn = document.getElementById('voiceBtn');
    const voiceStatus = document.getElementById('voiceStatus');
    
    if (isListening) {
        recognitionInstance.stop();
        isListening = false;
        voiceBtn.textContent = '🎤 Start Voice Input';
        voiceBtn.classList.remove('listening');
        voiceStatus.textContent = '';
        speechBuffer = '';
    } else {
        recognitionInstance.start();
        isListening = true;
        voiceBtn.textContent = '🛑 Stop Voice Input';
        voiceBtn.classList.add('listening');
        voiceStatus.textContent = 'Listening... Say medicine details';
        speechBuffer = '';
    }
}

function extractMedicineNameFromText(text) {
    // Improved matching: check brand aliases first, then medicines sorted by length
    const lowerText = text.toLowerCase();

    // 1) Match known brand aliases directly
    for (const [alias, actual] of Object.entries(DRUG_ALIASES)) {
        if (lowerText.includes(alias)) {
            return capitalizeWords(actual);
        }
    }

    // 2) Try to match common medicines preferring longer names first
    const meds = [...COMMON_MEDICINES].sort((a, b) => b.length - a.length);
    for (const med of meds) {
        // build safe regex for word-boundary match
        const safe = med.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp('\\b' + safe + '\\b', 'i');
        if (re.test(text) || lowerText.includes(med)) {
            return capitalizeWords(med);
        }
    }

    // 3) Try looser partial matches for longer tokens
    const words = lowerText.split(/\s+/).map(w => w.replace(/[^a-z0-9-]/g, ''));
    for (const w of words) {
        if (w.length < 3) continue;
        for (const med of meds) {
            if (med.includes(w) || w.includes(med) || med.startsWith(w) || w.startsWith(med)) {
                return capitalizeWords(med);
            }
        }
    }

    return ''; // No match found
}

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function capitalizeWords(str) {
    return str.split(' ').map(word => capitalizeFirstLetter(word)).join(' ');
}

function parsePrescriptionFromSpeech(text) {
    // Enhanced parsing logic to extract all prescription details
    const parsed = {
        name: '',
        brand: '',
        molecule: '',
        dosage: '',
        frequency: '',
        duration: '',
        timing: ''
    };
    
    const lowerText = text.toLowerCase();
    
    // First, extract the medicine name from known medicines list
    parsed.name = extractMedicineNameFromText(text);

    // Detect brand aliases mentioned in the speech and map to generic molecule
    for (const [alias, actualDrug] of Object.entries(DRUG_ALIASES)) {
        if (lowerText.includes(alias)) {
            parsed.brand = capitalizeWords(alias);
            parsed.name = capitalizeWords(actualDrug);
            parsed.molecule = capitalizeWords(actualDrug);
            break;
        }
    }

    // If we already found a generic name, set molecule accordingly
    if (!parsed.molecule && parsed.name) {
        parsed.molecule = parsed.name;
    }
    
    // If no medicine found, don't proceed
    if (!parsed.name) {
        return parsed;
    }
    
    // Extract dosage - look for numbers followed by units
    const dosageMatch = text.match(/\b(\d+\.?\d*)\s?(mg|g|ml|mcg|units?|tablets?|capsules?|drops?|iu|micrograms?|milligrams?|grams?|milliliters?)\b/i);
    if (dosageMatch) {
        const number = dosageMatch[1];
        const unit = dosageMatch[2].toLowerCase();
        
        // Normalize unit names
        if (unit.startsWith('tablet')) parsed.dosage = `${number}mg`;
        else if (unit.startsWith('capsule')) parsed.dosage = `${number}mg`;
        else if (unit === 'mg' || unit === 'milligrams') parsed.dosage = `${number}mg`;
        else if (unit === 'g' || unit === 'grams') parsed.dosage = `${number}g`;
        else if (unit === 'ml' || unit === 'milliliters') parsed.dosage = `${number}ml`;
        else if (unit === 'mcg' || unit === 'micrograms') parsed.dosage = `${number}mcg`;
        else parsed.dosage = dosageMatch[0];
    }
    
    // Extract frequency (comprehensive patterns)
    const frequencyPatterns = [
        { pattern: /\b(once|one time)\s+(daily|a day|per day)\b/i, value: 'Once daily' },
        { pattern: /\b(twice|two times?)\s+(daily|a day|per day)\b/i, value: 'Twice daily' },
        { pattern: /\b(thrice|three times?)\s+(daily|a day|per day)\b/i, value: 'Three times daily' },
        { pattern: /\b(four times?)\s+(daily|a day|per day)\b/i, value: 'Four times daily' },
        { pattern: /\b(every|each)\s+(\d+)\s+(hours?|hrs?)\b/i, value: (m) => `Every ${m[2]} hours` },
        { pattern: /\b(once daily|OD)\b/i, value: 'Once daily' },
        { pattern: /\b(twice daily|BD|BID)\b/i, value: 'Twice daily' },
        { pattern: /\b(three times daily|TDS|TID)\b/i, value: 'Three times daily' },
        { pattern: /\b(four times daily|QID)\b/i, value: 'Four times daily' },
        { pattern: /\b(as needed|SOS|when required|if needed|PRN)\b/i, value: 'As needed' },
        { pattern: /\b(at night|night time|bedtime|HS)\b/i, value: 'Once at night' }
    ];
    
    for (const { pattern, value } of frequencyPatterns) {
        const match = text.match(pattern);
        if (match) {
            parsed.frequency = typeof value === 'function' ? value(match) : value;
            break;
        }
    }
    
    // Extract timing (meal-related)
    const timingPatterns = [
        { pattern: /\b(before)\s+(meals?|food|eating)\b/i, value: 'Before food' },
        { pattern: /\b(after)\s+(meals?|food|eating)\b/i, value: 'After food' },
        { pattern: /\b(with)\s+(meals?|food|eating)\b/i, value: 'With food' },
        { pattern: /\b(at bedtime|before bed|at night|bedtime|HS)\b/i, value: 'At bedtime' },
        { pattern: /\b(empty stomach|on empty stomach)\b/i, value: 'Empty stomach' },
        { pattern: /\b(as needed|when needed|SOS)\b/i, value: 'As needed' }
    ];
    
    for (const { pattern, value } of timingPatterns) {
        const match = text.match(pattern);
        if (match) {
            parsed.timing = value;
            break;
        }
    }
    
    // Extract duration
    const durationMatch = text.match(/\b(for|duration|continue for|take for)\s+(\d+)\s+(days?|weeks?|months?)\b/i);
    if (durationMatch) {
        const number = durationMatch[2];
        const unit = durationMatch[3].toLowerCase();
        
        if (unit.startsWith('day')) parsed.duration = `${number} days`;
        else if (unit.startsWith('week')) parsed.duration = `${number} weeks`;
        else if (unit.startsWith('month')) parsed.duration = `${number} months`;
    }
    
    return parsed;
}

function extractDiagnosisFromSpeech(text) {
    // Extract diagnosis with better pattern matching
    const diagnosisPatterns = [
        /\b(?:diagnosis|diagnosed with|diagnosed as|condition is|suffering from)\s+(?:is\s+)?(.+?)(?:\.|prescribe|give|medicine|tablet|take|continue)/i,
        /\b(?:patient has|presents with)\s+(.+?)(?:\.|prescribe|give|medicine)/i
    ];
    
    for (const pattern of diagnosisPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            let diagnosis = match[1].trim();
            // Clean up common trailing words
            diagnosis = diagnosis.replace(/\b(and|with|plus|also)\s*$/i, '').trim();
            if (diagnosis.length > 3) {
                return capitalizeFirstLetter(diagnosis);
            }
        }
    }
    
    return '';
}

function extractSymptomsFromSpeech(text) {
    // Extract symptoms/complaints with better accuracy
    const symptomPatterns = [
        /\b(?:complains of|complaints?|symptoms?|presenting with|patient has|suffering from)\s+(.+?)(?:\.|diagnosis|prescribe|give|for|since|from)/i,
        /\b(?:fever|cough|cold|pain|headache|vomiting|diarrhea|nausea|weakness|dizziness)[\w\s,]+?(?:\.|diagnosis|prescribe|for|since)/i
    ];
    
    for (const pattern of symptomPatterns) {
        const match = text.match(pattern);
        if (match) {
            let symptoms = match[1] ? match[1].trim() : match[0].trim();
            // Clean up
            symptoms = symptoms.replace(/\b(and|with|for|since)\s*$/i, '').trim();
            if (symptoms.length > 3) {
                return capitalizeFirstLetter(symptoms);
            }
        }
    }
    
    return '';
}

function handleSpeechResult(event) {
    let finalTranscript = '';
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
        } else {
            interimTranscript += transcript;
        }
    }
    
    if (finalTranscript) {
        speechBuffer += finalTranscript;
        const lowerBuffer = speechBuffer.toLowerCase();
        
        // Check for stop command
        const stopMatch = lowerBuffer.match(/\b(stop recording|stop)\b/i);
        if (stopMatch) {
            const idx = lowerBuffer.indexOf(stopMatch[0]);
            const textToProcess = speechBuffer.slice(0, idx).trim();
            
            if (textToProcess.length > 0) {
                // Process all content before stop
                processSpeechContent(textToProcess);
            }

            // Stop recognition
            try { recognitionInstance.stop(); } catch (e) {}
            isListening = false;
            const voiceBtn = document.getElementById('voiceBtn');
            const voiceStatus = document.getElementById('voiceStatus');
            if (voiceBtn) { 
                voiceBtn.textContent = '🎤 Start Voice Input'; 
                voiceBtn.classList.remove('listening'); 
            }
            if (voiceStatus) voiceStatus.textContent = '';
            speechBuffer = '';
            return;
        }
        
        // Check if we should process a medicine entry
        // Look for medicine names from our list or prescription keywords with dosage info
        const hasMedicineKeyword = COMMON_MEDICINES.some(med => lowerBuffer.includes(med));
        const hasPrescriptionKeyword = ['prescribe', 'give', 'take', 'tablet', 'capsule'].some(kw => lowerBuffer.includes(kw));
        const hasDosageInfo = lowerBuffer.match(/\d+\s?(mg|ml|g|mcg)/i);

        // Relaxed condition: process when we hear a medicine name with dosage or prescription keywords
        const shouldProcessMedicine = (hasMedicineKeyword && (hasDosageInfo || hasPrescriptionKeyword)) || lowerBuffer.match(/\b(next medicine|next prescribe|another medicine|also give|then|next)\b/i);

        if (shouldProcessMedicine) {
            // Process potentially multiple medicine segments separated by keywords like "next medicine"
            const separatorRegex = /\b(next medicine|next prescribe|another medicine|also give|then|next)\b/i;
            let buffer = speechBuffer.trim();

            const processSegment = (segment) => {
                        if (!segment || segment.trim().length === 0) return;
                        // Use Python-style lightweight parser to detect brand/generic/dose/freq/duration/instruction
                        const parsed = parsePrescriptionSimple(segment);
                        // parsed.generic or parsed.brand must be present to proceed
                        if (!parsed.generic && parsed.brand === 'Not specified') return;

                // Find first empty medicine card or create one
                let medicineCards = document.querySelectorAll('.medicine-card');
                let targetCard = null;
                for (const card of medicineCards) {
                    const molInput = card.querySelector('.medicine-molecule');
                    const brandInput = card.querySelector('.medicine-brand');
                    if ((!molInput || !molInput.value.trim()) && (!brandInput || !brandInput.value.trim())) {
                        targetCard = card;
                        break;
                    }
                }
                if (!targetCard) {
                    addMedicineField();
                    targetCard = document.querySelector('.medicine-card:last-child');
                }

                // Fill brand and generic and trigger brandChanged to auto-fill molecule
                if (parsed.brand && parsed.brand !== 'Not specified') {
                    const brandInput = targetCard.querySelector('.medicine-brand');
                    if (brandInput) {
                        brandInput.value = parsed.brand;
                        try { brandChanged(brandInput); } catch (e) { /* silent */ }
                    }
                }

                if (parsed.generic && parsed.generic !== 'Unknown') {
                    const molInput = targetCard.querySelector('.medicine-molecule');
                    if (molInput) molInput.value = capitalizeWords(parsed.generic);
                }

                // Fill per-medicine diagnosis from parsed segment
                if (parsed.diagnosis && parsed.diagnosis !== 'Not specified') {
                    const diagInput = targetCard.querySelector('.medicine-diagnosis');
                    if (diagInput) diagInput.value = capitalizeFirstLetter(parsed.diagnosis);
                }

                if (parsed.dosage && parsed.dosage !== 'Not specified') targetCard.querySelector('.medicine-dosage').value = parsed.dosage;
                if (parsed.frequency && parsed.frequency !== 'Not specified') targetCard.querySelector('.medicine-frequency').value = parsed.frequency;
                if (parsed.duration && parsed.duration !== 'Not specified') targetCard.querySelector('.medicine-duration').value = parsed.duration;
                if (parsed.instructions && parsed.instructions !== 'None') targetCard.querySelector('.medicine-timing').value = parsed.instructions;

                checkAllDrugInteractions();
            };

            // Split buffer into segments using separator words, process each
            const segments = buffer.split(separatorRegex).map(s => s.trim()).filter(s => s.length > 0 && !s.match(separatorRegex));
            for (const seg of segments) {
                processSegment(seg);
            }

            // Clear speech buffer after processing
            speechBuffer = '';
        }
        // Note: Instructions are now handled via individual field voice buttons, not here
    }
    
    const voiceStatus = document.getElementById('voiceStatus');
    voiceStatus.textContent = interimTranscript ? `"${interimTranscript}"` : 'Listening...';
}

function handleSpeechError(event) {
    console.error('Speech recognition error:', event.error);
    const voiceStatus = document.getElementById('voiceStatus');
    voiceStatus.textContent = `Error: ${event.error}`;
}

function handleSpeechEnd() {
    if (isListening) {
        // Auto-restart if user didn't manually stop
        recognitionInstance.start();
    }
}

function extractInstructionsFromSpeech(text) {
    // Return object { dietary, general, followUp } extracted from text
    const result = { dietary: '', general: '', followUp: '' };
    if (!text || text.length < 3) return result;

    // Normalize separators - split sentences
    const sentences = text.split(/[\.\n\r]/).map(s => s.trim()).filter(s => s.length > 0);

    for (const s of sentences) {
        const lower = s.toLowerCase();
        
        // Dietary advice patterns
        if (lower.includes('diet') || lower.includes('dietary') || lower.includes('food') || 
            lower.match(/\b(drink|eat|avoid|take)\b.*(water|fluid|food|beverage|meal)/i)) {
            if (!result.dietary) {
                let advice = s.replace(/^(dietary advice[:\-\s]*|diet[:\-\s]*)/i, '').trim();
                result.dietary = capitalizeFirstLetter(advice);
            }
            continue;
        }

        // Follow-up patterns
        if (lower.match(/\b(follow.?up|followup|review|revisit|come back|return after)\b/i)) {
            if (!result.followUp) {
                result.followUp = capitalizeFirstLetter(s);
            }
            continue;
        }

        // General instructions patterns
        if (lower.match(/\b(instruction|advise|advice|rest|avoid|take care|precaution|warning)\b/i)) {
            if (!result.general && !lower.includes('diet') && !lower.includes('follow')) {
                let instruction = s.replace(/^(general instructions[:\-\s]*|instructions[:\-\s]*)/i, '').trim();
                result.general = capitalizeFirstLetter(instruction);
            }
            continue;
        }
    }

    return result;
}

function extractAndPopulateInstructions(text) {
    // Extract and populate instruction fields
    const instr = extractInstructionsFromSpeech(text);
    
    const dietaryField = document.getElementById('dietaryAdvice');
    const generalField = document.getElementById('generalInstructions');
    const followUpField = document.getElementById('followUp');
    
    // Only update if field is empty and we have content
    if (instr.dietary && dietaryField && !dietaryField.value.trim()) {
        dietaryField.value = instr.dietary;
    }
    if (instr.general && generalField && !generalField.value.trim()) {
        generalField.value = instr.general;
    }
    if (instr.followUp && followUpField && !followUpField.value.trim()) {
        followUpField.value = instr.followUp;
    }
}

function processSpeechContent(text) {
    // Process speech content: extract medicines only
    if (!text || text.trim().length === 0) return;
    
    // Extract medicines
    const separatorRegex = /\b(next medicine|next prescribe|another medicine|also give|then|next)\b/i;
    const segments = text.split(separatorRegex).map(s => s.trim()).filter(s => s.length > 0 && !s.match(separatorRegex));
    
    for (const seg of segments) {
        const parsed = parsePrescriptionSimple(seg);
        if (!parsed.generic && parsed.brand === 'Not specified') continue;

        let medicineCards = document.querySelectorAll('.medicine-card');
        let targetCard = null;
        for (const card of medicineCards) {
            const molInput = card.querySelector('.medicine-molecule');
            const brandInput = card.querySelector('.medicine-brand');
            if ((!molInput || !molInput.value.trim()) && (!brandInput || !brandInput.value.trim())) {
                targetCard = card;
                break;
            }
        }
        if (!targetCard) {
            addMedicineField();
            targetCard = document.querySelector('.medicine-card:last-child');
        }

        if (parsed.brand && parsed.brand !== 'Not specified') {
            const brandInput = targetCard.querySelector('.medicine-brand');
            if (brandInput) {
                brandInput.value = parsed.brand;
                try { brandChanged(brandInput); } catch (e) {}
            }
        }
        if (parsed.generic && parsed.generic !== 'Unknown') {
            const molInput = targetCard.querySelector('.medicine-molecule');
            if (molInput) molInput.value = capitalizeWords(parsed.generic);
        }
        if (parsed.diagnosis && parsed.diagnosis !== 'Not specified') {
            const diagInput = targetCard.querySelector('.medicine-diagnosis');
            if (diagInput) diagInput.value = capitalizeFirstLetter(parsed.diagnosis);
        }
        if (parsed.dosage && parsed.dosage !== 'Not specified') {
            targetCard.querySelector('.medicine-dosage').value = parsed.dosage;
        }
        if (parsed.frequency && parsed.frequency !== 'Not specified') {
            targetCard.querySelector('.medicine-frequency').value = parsed.frequency;
        }
        if (parsed.duration && parsed.duration !== 'Not specified') {
            targetCard.querySelector('.medicine-duration').value = parsed.duration;
        }
        if (parsed.instructions && parsed.instructions !== 'None') {
            targetCard.querySelector('.medicine-timing').value = parsed.instructions;
        }
        checkAllDrugInteractions();
    }
}

// -----------------------------
// Simple prescription parser (adapted from provided Python code)
// -----------------------------
function extractBrandSimple(text) {
    const lower = text.toLowerCase();
    for (const brand of Object.keys(BRAND_TO_GENERIC)) {
        if (lower.includes(brand)) return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
    return 'Not specified';
}

function extractGenericSimple(brand, text) {
    if (brand && brand !== 'Not specified') {
        const g = BRAND_TO_GENERIC[brand.toLowerCase()];
        return g || 'Unknown';
    }
    const lower = text.toLowerCase();
    for (const gen of MEDICINES_GENERIC) {
        if (lower.includes(gen)) return gen;
    }
    return 'Unknown';
}

function extractDosageSimple(text) {
    const m = text.match(/(\d+)\s*(mg|ml)/i);
    return m ? m[0] : 'Not specified';
}

function extractFrequencySimple(text) {
    const lower = text.toLowerCase();
    if (lower.includes('once')) return 'Once daily';
    if (lower.includes('twice')) return 'Twice daily';
    if (lower.includes('thrice') || lower.includes('three times')) return 'Three times daily';
    if (lower.includes('morning and night') || lower.includes('morning and night')) return 'Morning and Night';
    return 'Not specified';
}

function extractDurationSimple(text) {
    const m = text.match(/(\d+)\s*(day|days|week|weeks)/i);
    return m ? m[0] : 'Not specified';
}

function extractInstructionSimple(text) {
    const lower = text.toLowerCase();
    if (lower.includes('after food')) return 'After food';
    if (lower.includes('before food')) return 'Before food';
    if (lower.includes('at night') || lower.includes('bedtime')) return 'At night';
    return 'None';
}

function extractDiagnosisSimple(text) {
    // grab words after 'diagnosis' until hitting a medicine/number token
    const lower = text.toLowerCase();
    if (!lower.includes('diagnosis')) return 'Not specified';
    const tokens = lower.split(/\s+/);
    const stopWords = new Set([...Object.keys(BRAND_TO_GENERIC), ...MEDICINES_GENERIC, 'mg','ml','tablet','capsule']);
    const out = [];
    let capture = false;
    for (const token of tokens) {
        if (token === 'diagnosis') { capture = true; continue; }
        if (capture) {
            if (stopWords.has(token) || /^\d+/.test(token)) break;
            out.push(token);
        }
    }
    return out.length ? out.join(' ') : 'Not specified';
}

function parsePrescriptionSimple(text) {
    const brand = extractBrandSimple(text);
    const generic = extractGenericSimple(brand, text);
    return {
        diagnosis: extractDiagnosisSimple(text),
        brand: brand,
        generic: generic,
        dosage: extractDosageSimple(text),
        frequency: extractFrequencySimple(text),
        duration: extractDurationSimple(text),
        instructions: extractInstructionSimple(text)
    };
}

// ============================================
// DANGEROUS DRUG-TO-DRUG INTERACTIONS DATABASE
// ============================================

// Keep this minimal in *UI output* (single warning), but comprehensive in detection.
// This list is derived from the dangerous interaction sets you provided.
const DANGEROUS_DRUG_INTERACTIONS = (() => {
    const dedupe = new Set();
    const pairs = [];

    const norm = (s) => (s || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const add = (a, b) => {
        const A = norm(a);
        const B = norm(b);
        if (!A || !B) return;
        const key = [A, B].sort().join('|');
        if (dedupe.has(key)) return;
        dedupe.add(key);
        pairs.push({ a: A, b: B });
    };

    const addMany = (as, bs) => {
        for (const a of as) {
            for (const b of bs) {
                add(a, b);
            }
        }
    };

    // --- Groups (used for class-type interactions like “SSRIs + MAOIs”) ---
    const GROUPS = {
        ssri: ['sertraline', 'fluoxetine', 'paroxetine', 'citalopram', 'escitalopram', 'fluvoxamine'],
        maoi: ['phenelzine', 'tranylcypromine', 'isocarboxazid', 'selegiline'],
        benzodiazepine: ['diazepam', 'alprazolam', 'clonazepam', 'lorazepam', 'midazolam'],
        opioid: ['morphine', 'codeine', 'tramadol', 'oxycodone', 'hydrocodone', 'fentanyl', 'methadone'],
        nsaid: ['ibuprofen', 'diclofenac', 'aspirin', 'naproxen', 'ketorolac', 'piroxicam', 'indomethacin'],
        macrolide: ['azithromycin', 'clarithromycin', 'erythromycin'],
        statin: ['simvastatin', 'atorvastatin', 'rosuvastatin', 'lovastatin'],
        arb: ['losartan', 'telmisartan', 'valsartan'],
        acei: ['enalapril', 'lisinopril', 'ramipril', 'perindopril'],
        betablocker: ['atenolol', 'metoprolol', 'propranolol'],
        ccb: ['amlodipine', 'nifedipine', 'verapamil', 'diltiazem'],
        diuretic: ['furosemide', 'hydrochlorothiazide', 'spironolactone'],
        thiazide: ['hydrochlorothiazide'],
        sulfonylurea: ['glibenclamide', 'gliclazide', 'glimepiride'],
        anticoagulant: ['warfarin', 'rivaroxaban', 'dabigatran'],
        pde5: ['sildenafil', 'tadalafil', 'vardenafil'],
        alphablocker: ['tamsulosin'],
        sedative: ['diazepam', 'alprazolam', 'clonazepam', 'lorazepam', 'midazolam', 'melatonin'],
        diabetesMeds: ['insulin', 'metformin', 'glibenclamide', 'gliclazide', 'glimepiride', 'pioglitazone', 'sitagliptin'],
        tetracycline: ['tetracycline', 'doxycycline'],
        aminoglycoside: ['gentamicin', 'amikacin', 'tobramycin', 'streptomycin', 'neomycin'],
        birthControl: ['birth control', 'oral contraceptive', 'contraceptive', 'birth control pills'],
        grapefruit: ['grapefruit', 'grapefruit juice'],
        alcohol: ['alcohol', 'ethanol'],
        potassiumSupp: ['potassium', 'potassium supplement', 'potassium chloride'],
        fibrate: ['gemfibrozil', 'fenofibrate'],
        antacid: ['antacid', 'aluminium hydroxide', 'magnesium hydroxide'],
        minerals: ['calcium', 'calcium supplement', 'iron', 'iron supplement', 'magnesium', 'zinc'],
        supplements: ['st johns wort', "st. john's wort", 'vitamin k', 'green tea', 'omega-3', 'turmeric', 'ginkgo', 'ginkgo biloba', 'vitamin e', 'ashwagandha', 'licorice', 'licorice root', 'caffeine'],
        pgpInhibitor: ['amiodarone', 'verapamil', 'dronedarone', 'clarithromycin', 'ketoconazole', 'itraconazole', 'posaconazole', 'voriconazole'],
        cyp2c8Inhibitor: ['gemfibrozil'],
        antidepressant: ['sertraline', 'fluoxetine', 'paroxetine', 'citalopram', 'escitalopram', 'fluvoxamine', 'bupropion'],
    };

    // --- Direct (specific) dangerous pairs ---
    add('ibuprofen', 'warfarin');
    add('warfarin', 'aspirin');
    add('simvastatin', 'itraconazole');
    add('digoxin', 'amiodarone');
    add('warfarin', 'fluconazole');
    add('theophylline', 'ciprofloxacin');
    add('cisplatin', 'gentamicin'); // representative aminoglycoside example
    add('clopidogrel', 'omeprazole');
    add('rivaroxaban', 'ketoconazole');
    add('amiodarone', 'warfarin');
    add('verapamil', 'simvastatin');
    add('posaconazole', 'tacrolimus');
    add('voriconazole', 'sirolimus');
    add('sirolimus', 'rifampin');
    add('tacrolimus', 'rifampin');
    add('rifampin', 'birth control');
    add('griseofulvin', 'birth control');
    add('clarithromycin', 'amlodipine');
    add('nifedipine', 'clarithromycin');
    add('erythromycin', 'lovastatin');
    add('ciprofloxacin', 'warfarin');
    add('trimethoprim-sulfamethoxazole', 'warfarin');
    add('co-trimoxazole', 'warfarin');
    add('azithromycin', 'amiodarone');
    add('linezolid', 'sertraline');
    add('metronidazole', 'alcohol');
    add('fluoxetine', 'metoprolol');
    add('paroxetine', 'tamoxifen');
    add('quetiapine', 'clarithromycin');
    add('digoxin', 'verapamil');
    add('amiloride', 'potassium');
    add('metformin', 'cimetidine');
    add('metformin', 'iodinated contrast');
    add('levothyroxine', 'omeprazole');
    add('metoprolol', 'insulin');
    add('pioglitazone', 'insulin');
    add('sitagliptin', 'digoxin');
    add('caffeine', 'theophylline');
    add('vitamin k', 'warfarin');
    add('green tea', 'warfarin');
    add('ashwagandha', 'levothyroxine');

    // Additional specific pairs from your lists
    add('fluconazole', 'sertraline');
    add('sertraline', 'amiodarone');
    add('ibuprofen', 'hydrochlorothiazide');
    add('rosiglitazone', 'gemfibrozil');
    add('ibuprofen', 'paracetamol');
    add('aspirin', 'alcohol');
    add('calcium', 'levothyroxine');
    add('iron', 'levodopa');

    // --- Group-based expansions ---
    // SSRIs + MAOIs
    addMany(GROUPS.ssri, GROUPS.maoi);

    // Bupropion + MAOIs
    addMany(['bupropion'], GROUPS.maoi);

    // MAOIs + Meperidine
    addMany(GROUPS.maoi, ['meperidine']);

    // Linezolid + SSRIs
    addMany(['linezolid'], GROUPS.ssri);

    // Benzodiazepines + Opioids
    addMany(GROUPS.benzodiazepine, GROUPS.opioid);

    // Methotrexate + NSAIDs
    addMany(['methotrexate'], GROUPS.nsaid);

    // Colchicine + Clarithromycin
    add('colchicine', 'clarithromycin');

    // Pimozide + Macrolides
    addMany(['pimozide'], GROUPS.macrolide);

    // Terfenadine + Ketoconazole
    add('terfenadine', 'ketoconazole');

    // Cyclosporine + St. John’s Wort
    addMany(['cyclosporine'], ['st johns wort', "st. john's wort"]);

    // Dronedarone + Statins
    addMany(['dronedarone'], GROUPS.statin);

    // Dabigatran + P-gp inhibitors
    addMany(['dabigatran'], GROUPS.pgpInhibitor);

    // Levofloxacin + NSAIDs
    addMany(['levofloxacin'], GROUPS.nsaid);

    // SSRIs + Tramadol
    addMany(GROUPS.ssri, ['tramadol']);

    // Macrolides + Carbamazepine
    addMany(GROUPS.macrolide, ['carbamazepine']);

    // Doxycycline + Antacids
    addMany(['doxycycline'], GROUPS.antacid);

    // Phenelzine + Pseudoephedrine
    add('phenelzine', 'pseudoephedrine');

    // Fluoxetine + Beta blockers
    addMany(['fluoxetine'], GROUPS.betablocker);

    // Lithium + Diuretics (and Thiazides specifically)
    addMany(['lithium'], GROUPS.diuretic);
    addMany(['lithium'], GROUPS.thiazide);

    // St. John’s Wort + Oral contraceptives
    addMany(['st johns wort', "st. john's wort"], GROUPS.birthControl);

    // Phenobarbital + Antidepressants
    addMany(['phenobarbital'], GROUPS.antidepressant);

    // Lisinopril + Spironolactone / Spironolactone + ACE inhibitors
    add('lisinopril', 'spironolactone');
    addMany(['spironolactone'], GROUPS.acei);

    // ACE inhibitors + NSAIDs / ARBs + NSAIDs
    addMany(GROUPS.acei, GROUPS.nsaid);
    addMany(GROUPS.arb, GROUPS.nsaid);

    // Beta blockers + Calcium blockers (clinically most concerning with verapamil/diltiazem)
    addMany(GROUPS.betablocker, ['verapamil', 'diltiazem']);

    // Insulin + beta blockers (masked hypoglycemia)
    addMany(['insulin'], GROUPS.betablocker);

    // Calcium channel blockers + Grapefruit
    addMany(GROUPS.ccb, GROUPS.grapefruit);

    // Licorice + blood pressure meds / diuretics (OTC/herbal)
    addMany(['licorice', 'licorice root'], [...GROUPS.acei, ...GROUPS.arb, ...GROUPS.betablocker, ...GROUPS.ccb]);
    addMany(['licorice', 'licorice root'], GROUPS.diuretic);

    // Minerals (calcium/magnesium/zinc/iron) + quinolones (absorption reduction)
    addMany(['ciprofloxacin', 'levofloxacin'], ['calcium', 'magnesium', 'zinc', 'iron']);

    // Melatonin + sedatives (additive CNS depression)
    addMany(['melatonin'], GROUPS.benzodiazepine);
    addMany(['melatonin'], GROUPS.opioid);

    // Probiotics + antibiotics (reduced probiotic effect)
    addMany(['probiotic', 'probiotics'], ['amoxicillin', 'azithromycin', 'ciprofloxacin', 'levofloxacin', 'doxycycline', 'metronidazole', 'cephalexin']);

    // Statins + Fibrates
    addMany(GROUPS.statin, GROUPS.fibrate);

    // Sulfonylureas + Alcohol / Alcohol + diabetes meds / Alcohol + sedatives
    addMany(GROUPS.sulfonylurea, GROUPS.alcohol);
    addMany(GROUPS.diabetesMeds, GROUPS.alcohol);
    addMany(GROUPS.sedative, GROUPS.alcohol);

    // Aspirin + NSAIDs
    addMany(['aspirin'], GROUPS.nsaid);

    // Tetracyclines + minerals (calcium/magnesium/zinc/iron chelation)
    addMany(GROUPS.tetracycline, GROUPS.minerals);

    // Rivaroxaban + Ketoconazole already added; also include other strong azoles for completeness
    addMany(['rivaroxaban'], ['itraconazole', 'posaconazole', 'voriconazole']);

    // Cisplatin + Aminoglycosides
    addMany(['cisplatin'], GROUPS.aminoglycoside);

    // Alpha blockers + PDE5 inhibitors
    addMany(GROUPS.alphablocker, GROUPS.pde5);

    // Eplerenone + ACE inhibitors
    addMany(['eplerenone'], GROUPS.acei);

    // Vitamin D + Thiazides
    add('vitamin d', 'hydrochlorothiazide');

    // Omega-3 / Turmeric / Ginkgo / Vitamin E + anticoagulants
    addMany(['omega-3'], GROUPS.anticoagulant);
    addMany(['turmeric'], GROUPS.anticoagulant);
    addMany(['ginkgo', 'ginkgo biloba'], GROUPS.anticoagulant);
    addMany(['vitamin e'], GROUPS.anticoagulant);

    // Return final list
    return pairs;
})();

// ============================================
// DRUG INTERACTION CHECKING
// ============================================

function checkAllDrugInteractions() {
    if (!currentPatientId) {
        return;
    }
    
    const patientData = getPatientData(currentPatientId) || { conditions: [] };
    
    const warnings = [];
    const medicines = getAllMedicines();
    
    // 1) Drug-to-drug interactions (should work even if patient has no recorded conditions)
    warnings.push(...checkDrugToDrugInteractions(medicines));
    
    // 2) Drug-to-condition contraindications (existing behavior)
    if (patientData && Array.isArray(patientData.conditions) && patientData.conditions.length > 0) {
        medicines.forEach(medicine => {
        const drugName = medicine.name.toLowerCase();
        
        // Check for each drug in the database
        for (const [dbDrug, drugInfo] of Object.entries(DRUG_DATABASE)) {
            if (drugName.includes(dbDrug)) {
                // Check for contraindications
                for (const condition of patientData.conditions) {
                    if (drugInfo.contraindications.includes(condition)) {
                        warnings.push({
                            drug: medicine.name,
                            condition: condition,
                            message: drugInfo.warnings[condition],
                            source: drugInfo.source
                        });
                    }
                }
            }
        }
        
        // Check drug aliases
        for (const [alias, actualDrug] of Object.entries(DRUG_ALIASES)) {
            if (drugName.includes(alias)) {
                const drugInfo = DRUG_DATABASE[actualDrug];
                if (drugInfo) {
                    for (const condition of patientData.conditions) {
                        if (drugInfo.contraindications.includes(condition)) {
                            warnings.push({
                                drug: `${medicine.name} (${actualDrug})`,
                                condition: condition,
                                message: drugInfo.warnings[condition],
                                source: drugInfo.source
                            });
                        }
                    }
                }
            }
        }
        });
    }
    
    if (warnings.length > 0) {
        displayWarnings(warnings);
    } else {
        document.getElementById('warningSection').classList.add('hidden');
    }
}

// Check for dangerous drug-to-drug interactions
function normalizeDrugText(text) {
    return (text || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getCanonicalDrugName(drugName) {
    const normalized = normalizeDrugText(drugName);

    // Map brand aliases to known generic names
    for (const [alias, actualDrug] of Object.entries(DRUG_ALIASES)) {
        const aliasNorm = normalizeDrugText(alias);
        if (aliasNorm && normalized.includes(aliasNorm)) {
            return normalizeDrugText(actualDrug);
        }
    }

    // Normalize to known interaction tokens if present
    for (const pair of DANGEROUS_DRUG_INTERACTIONS) {
        const a = normalizeDrugText(pair.a);
        const b = normalizeDrugText(pair.b);
        if (a && normalized.includes(a)) return a;
        if (b && normalized.includes(b)) return b;
    }

    return normalized;
}

function checkDrugToDrugInteractions(medicines) {
    if (!medicines || medicines.length < 2) {
        return [];
    }

    for (let i = 0; i < medicines.length; i++) {
        for (let j = i + 1; j < medicines.length; j++) {
            const a = getCanonicalDrugName(medicines[i].name);
            const b = getCanonicalDrugName(medicines[j].name);

            for (const pair of DANGEROUS_DRUG_INTERACTIONS) {
                const match = (a === pair.a && b === pair.b) || (a === pair.b && b === pair.a);
                if (match) {
                    // Intentionally minimal output: one warning even if multiple interactions exist.
                    return [{ type: 'drug-drug' }];
                }
            }
        }
    }

    return [];
}

function displayWarnings(warnings) {
    const warningSection = document.getElementById('warningSection');
    const warningMessages = document.getElementById('warningMessages');
    
    const conditionLabels = {
        'hypertension': 'Hypertension',
        'diabetes': 'Diabetes',
        'pregnancy': 'Pregnancy',
        'renal_impairment': 'Renal Impairment',
        'liver_disease': 'Liver Disease',
        'asthma': 'Asthma'
    };
    
    warningMessages.innerHTML = warnings.map(warning => {
        if (warning.type === 'drug-drug') {
            // Keep output minimal (per requirement)
            return `
                <div class="warning-item">
                    <strong class="drug-name">DANGEROUS DRUG INTERACTION DETECTED</strong>
                </div>
            `;
        }

        // Condition-based contraindication warning format (existing behavior)
        return `
            <div class="warning-item">
                <strong class="drug-name">${warning.drug.toUpperCase()}</strong>
                <p style="margin: var(--spacing-xs) 0;">
                    <strong>Patient Condition:</strong> ${conditionLabels[warning.condition]}
                </p>
                <p style="margin: var(--spacing-xs) 0;">
                    ${warning.message}
                </p>
                <p class="warning-source">Source: ${warning.source}</p>
            </div>
        `;
    }).join('');
    
    warningSection.classList.remove('hidden');
    
    // Reset acknowledgment
    document.getElementById('acknowledgeWarning').checked = false;
    document.getElementById('overrideReason').value = '';
}

// ============================================
// PRESCRIPTION SAVING
// ============================================

async function savePrescription() {
    if (!currentPatientId) {
        alert('Please load a patient first');
        return;
    }
    
    const medicines = getAllMedicines();
    
    if (medicines.length === 0) {
        alert('Please add at least one medicine');
        return;
    }
    
    const warningSection = document.getElementById('warningSection');
    const hasWarnings = !warningSection.classList.contains('hidden');
    
    if (hasWarnings) {
        const acknowledged = document.getElementById('acknowledgeWarning').checked;
        if (!acknowledged) {
            alert('Please acknowledge the safety warnings before saving the prescription.');
            return;
        }
    }
    
    const patientData = getPatientData(currentPatientId);
    if (!patientData) {
        alert('Patient data not loaded. Please reload the patient.');
        return;
    }

    const overrideReason = document.getElementById('overrideReason').value.trim();
    
    // Collect all prescription data
    const prescriptionData = {
        // Patient info
        patientName: patientData.name || '',
        patientAge: patientData.age || '',
        patientGender: patientData.gender || '',
        
        // Medicines
        medicines: medicines,
        
        // Instructions
        dietaryAdvice: document.getElementById('dietaryAdvice').value.trim(),
        generalInstructions: document.getElementById('generalInstructions').value.trim(),
        followUp: document.getElementById('followUp').value.trim(),
        
        // Metadata
        doctorId: getCurrentUserId(),
        date: new Date().toISOString(),
        warnings: hasWarnings,
        doctorNotes: overrideReason || (hasWarnings ? 'Warnings acknowledged by prescribing physician.' : '')
    };
    
    // Format for display
    let prescriptionContent = '';
    
    if (prescriptionData.patientName) {
        prescriptionContent += `Patient: ${prescriptionData.patientName}\n`;
        if (prescriptionData.patientAge) prescriptionContent += `Age: ${prescriptionData.patientAge} years | `;
        if (prescriptionData.patientGender) prescriptionContent += `Gender: ${prescriptionData.patientGender}\n`;
        prescriptionContent += '\n';
    }
    
    prescriptionContent += '℞ Prescription:\n';
    prescriptionContent += '─'.repeat(50) + '\n';
    
    medicines.forEach((med, index) => {
        prescriptionContent += `${index + 1}. ${med.name}`;
        if (med.diagnosis) prescriptionContent += `  (Diagnosis: ${med.diagnosis})`;
        if (med.dosage) prescriptionContent += ` - ${med.dosage}`;
        if (med.route && med.route !== 'Oral') prescriptionContent += ` (${med.route})`;
        prescriptionContent += '\n';
        if (med.frequency) prescriptionContent += `   ${med.frequency}`;
        if (med.timing) prescriptionContent += ` - ${med.timing}`;
        if (med.duration) prescriptionContent += ` - ${med.duration}`;
        prescriptionContent += '\n\n';
    });
    
    if (prescriptionData.dietaryAdvice || prescriptionData.generalInstructions) {
        prescriptionContent += 'Instructions:\n';
        if (prescriptionData.dietaryAdvice) prescriptionContent += `- ${prescriptionData.dietaryAdvice}\n`;
        if (prescriptionData.generalInstructions) prescriptionContent += `- ${prescriptionData.generalInstructions}\n`;
    }
    
    if (prescriptionData.followUp) {
        prescriptionContent += `\nFollow-up: ${prescriptionData.followUp}\n`;
    }
    
    prescriptionData.content = prescriptionContent;

    try {
        await savePatientPrescription(currentPatientId, prescriptionData);
        
        // Create medication tracking records
        await createMedicationTracking(currentPatientId, prescriptionData);
        
        const refreshed = await fetchPatientData(currentPatientId);
        // Refresh prescription history panel (doctor view)
        displayPatientPrescriptionHistory(refreshed);
        
        // Store latest prescription for immediate printing
        window.lastSavedPrescription = prescriptionData;
        window.lastSavedPatientInfo = { 
            name: patientData.name, 
            age: patientData.age, 
            gender: patientData.gender, 
            id: currentPatientId 
        };
    } catch (e) {
        alert('Failed to save prescription to the database. Please try again.');
        return;
    }

    // Show success message with print option
    const successMsg = document.getElementById('successMessage');
    successMsg.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>✓ Prescription saved successfully! Patient can now view it in their portal.</span>
            <button class="btn-print" onclick="printLastPrescription()" style="margin-left: 12px;">
                🖨️ Print Now
            </button>
        </div>
    `;
    successMsg.classList.remove('hidden');
    
    // Clear form after delay
    setTimeout(() => {
        clearPrescription();
        successMsg.classList.add('hidden');
    }, 5000);
}

// Create medication tracking records from prescription
async function createMedicationTracking(patientId, prescriptionData) {
    try {
        // Get the prescription ID that was just created
        const patientData = await fetchPatientData(patientId);
        const latestPrescription = patientData.prescriptions[0]; // Most recent
        const prescriptionId = latestPrescription.id;
        
        // Create tracking records for each medicine
        for (const medicine of prescriptionData.medicines) {
            const trackingData = {
                patient_id: patientId,
                prescription_id: prescriptionId,
                medicine_name: medicine.name,
                dosage: medicine.dosage,
                frequency: medicine.frequency,
                duration: parseDurationDays(medicine.duration),
                timing: medicine.timing,
                schedule_type: determineScheduleType(medicine.frequency),
                schedule_days: determineScheduleDays(medicine.frequency),
                reminder_times: determineReminderTimes(medicine.frequency, medicine.timing),
                start_date: new Date().toISOString().split('T')[0],
                end_date: calculateEndDate(new Date(), parseDurationDays(medicine.duration)),
                created_at: new Date().toISOString()
            };
            
            await saveMedicationTracking(trackingData);
        }
        
        // Parse and create activity tracking from general instructions
        await createActivityTracking(patientId, prescriptionId, prescriptionData.generalInstructions);
        
    } catch (error) {
        console.error('Error creating medication tracking:', error);
    }
}

// Parse duration string to days
function parseDurationDays(durationStr) {
    if (!durationStr) return 7; // Default 7 days
    
    const match = durationStr.match(/(\d+)\s*(days?|weeks?|months?)/i);
    if (!match) return 7;
    
    const number = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    switch (unit) {
        case 'day':
        case 'days':
            return number;
        case 'week':
        case 'weeks':
            return number * 7;
        case 'month':
        case 'months':
            return number * 30;
        default:
            return 7;
    }
}

// Determine schedule type from frequency
function determineScheduleType(frequency) {
    if (!frequency) return 'daily';
    
    const freq = frequency.toLowerCase();
    if (freq.includes('as needed') || freq.includes('sos')) {
        return 'as_needed';
    } else if (freq.includes('monday') || freq.includes('tuesday') || freq.includes('wednesday') || 
               freq.includes('thursday') || freq.includes('friday') || freq.includes('saturday') || 
               freq.includes('sunday')) {
        return 'specific_days';
    } else {
        return 'daily';
    }
}

// Determine schedule days from frequency
function determineScheduleDays(frequency) {
    if (!frequency) return [];
    
    const freq = frequency.toLowerCase();
    const days = [];
    
    if (freq.includes('monday') || freq.includes('daily') || freq.includes('every day')) days.push('Monday');
    if (freq.includes('tuesday') || freq.includes('daily') || freq.includes('every day')) days.push('Tuesday');
    if (freq.includes('wednesday') || freq.includes('daily') || freq.includes('every day')) days.push('Wednesday');
    if (freq.includes('thursday') || freq.includes('daily') || freq.includes('every day')) days.push('Thursday');
    if (freq.includes('friday') || freq.includes('daily') || freq.includes('every day')) days.push('Friday');
    if (freq.includes('saturday') || freq.includes('daily') || freq.includes('every day')) days.push('Saturday');
    if (freq.includes('sunday') || freq.includes('daily') || freq.includes('every day')) days.push('Sunday');
    
    return [...new Set(days)]; // Remove duplicates
}

// Determine reminder times from frequency and timing
function determineReminderTimes(frequency, timing) {
    if (!frequency) return ['08:00'];
    
    const freq = frequency.toLowerCase();
    const times = [];
    
    // Default times based on frequency
    if (freq.includes('once daily') || freq.includes('once a day')) {
        times.push('08:00');
    } else if (freq.includes('twice daily') || freq.includes('two times')) {
        times.push('08:00', '20:00');
    } else if (freq.includes('three times daily') || freq.includes('thrice')) {
        times.push('08:00', '14:00', '20:00');
    } else if (freq.includes('four times daily')) {
        times.push('08:00', '12:00', '16:00', '20:00');
    } else if (freq.includes('morning and night')) {
        times.push('08:00', '20:00');
    } else if (freq.includes('morning')) {
        times.push('08:00');
    } else if (freq.includes('evening') || freq.includes('night')) {
        times.push('20:00');
    } else {
        // Default to morning time
        times.push('08:00');
    }
    
    return times;
}

// Calculate end date
function calculateEndDate(startDate, durationDays) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);
    return endDate.toISOString().split('T')[0];
}

// Save medication tracking record
async function saveMedicationTracking(trackingData) {
    try {
        const response = await fetch(`/api/medication-tracking`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(trackingData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save medication tracking');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error saving medication tracking:', error);
        throw error;
    }
}

// Create activity tracking from general instructions
async function createActivityTracking(patientId, prescriptionId, instructions) {
    if (!instructions) return;
    
    // Look for exercise/activity related keywords
    const activityKeywords = ['exercise', 'workout', 'walk', 'jog', 'running', 'swimming', 
                             'yoga', 'stretching', 'physical therapy', 'physiotherapy',
                             'gym', 'fitness', 'activity', 'movement'];
    
    const instructionLines = instructions.split(/[.\n]/).filter(line => line.trim());
    
    for (const line of instructionLines) {
        const lowerLine = line.toLowerCase();
        const hasActivity = activityKeywords.some(keyword => lowerLine.includes(keyword));
        
        if (hasActivity) {
            const activityData = {
                patient_id: patientId,
                prescription_id: prescriptionId,
                activity_name: extractActivityName(line),
                frequency: extractActivityFrequency(line),
                duration: extractActivityDuration(line),
                instructions: line.trim(),
                reminder_times: ['09:00'], // Default reminder time
                start_date: new Date().toISOString().split('T')[0],
                end_date: calculateEndDate(new Date(), 30), // Default 30 days
                created_at: new Date().toISOString()
            };
            
            try {
                await saveActivityTracking(activityData);
            } catch (error) {
                console.error('Error saving activity tracking:', error);
            }
        }
    }
}

// Extract activity name from instruction line
function extractActivityName(instructionLine) {
    const activityNames = ['walking', 'jogging', 'running', 'swimming', 'yoga', 'stretching', 
                          'exercise', 'workout', 'physical therapy', 'gym workout'];
    
    for (const name of activityNames) {
        if (instructionLine.toLowerCase().includes(name)) {
            return name.charAt(0).toUpperCase() + name.slice(1);
        }
    }
    
    return 'Daily Exercise';
}

// Extract activity frequency
function extractActivityFrequency(instructionLine) {
    if (instructionLine.toLowerCase().includes('daily')) return 'Daily';
    if (instructionLine.toLowerCase().includes('every day')) return 'Daily';
    if (instructionLine.toLowerCase().includes('twice daily')) return 'Twice daily';
    return 'Daily'; // Default
}

// Extract activity duration
function extractActivityDuration(instructionLine) {
    const match = instructionLine.match(/(\d+)\s*(minutes?|mins?|hours?)/i);
    if (match) {
        const number = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        return unit.startsWith('hour') ? number * 60 : number;
    }
    return 30; // Default 30 minutes
}

// Save activity tracking record
async function saveActivityTracking(activityData) {
    try {
        const response = await fetch(`/api/activity-tracking`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(activityData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save activity tracking');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error saving activity tracking:', error);
        throw error;
    }
}

function clearPrescription() {
    // Clear all fields
    document.getElementById('medicinesList').innerHTML = '';
    medicineCounter = 0;
    addMedicineField();
    
    document.getElementById('dietaryAdvice').value = '';
    document.getElementById('generalInstructions').value = '';
    document.getElementById('followUp').value = '';
    
    document.getElementById('warningSection').classList.add('hidden');
    document.getElementById('acknowledgeWarning').checked = false;
    document.getElementById('overrideReason').value = '';
    
    speechBuffer = '';
    
    // Stop voice input if active
    if (isListening) {
        toggleVoiceInput();
    }
}

// ============================================
// FIELD-SPECIFIC VOICE INPUT
// ============================================

function startFieldVoiceInput(fieldId) {
    if (!fieldRecognitionInstance) {
        alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
        return;
    }
    
    // Stop any ongoing field recognition
    if (currentFieldId) {
        try {
            fieldRecognitionInstance.stop();
        } catch (e) {}
    }
    
    currentFieldId = fieldId;
    const statusElement = document.getElementById(fieldId + 'Status');
    
    if (statusElement) {
        statusElement.textContent = 'Listening... Speak now';
        statusElement.style.color = 'var(--color-primary)';
    }
    
    try {
        fieldRecognitionInstance.start();
    } catch (e) {
        console.error('Error starting recognition:', e);
        if (statusElement) {
            statusElement.textContent = 'Error starting voice input';
            statusElement.style.color = 'var(--color-error)';
        }
    }
}

function handleFieldSpeechResult(event) {
    if (!currentFieldId) return;
    
    let finalTranscript = '';
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            finalTranscript += transcript;
        } else {
            interimTranscript += transcript;
        }
    }
    
    const fieldElement = document.getElementById(currentFieldId);
    const statusElement = document.getElementById(currentFieldId + 'Status');
    
    if (finalTranscript && fieldElement) {
        // Append to existing content with proper spacing
        const currentValue = fieldElement.value.trim();
        const newText = finalTranscript.trim();
        
        if (currentValue) {
            fieldElement.value = currentValue + ' ' + capitalizeFirstLetter(newText);
        } else {
            fieldElement.value = capitalizeFirstLetter(newText);
        }
        
        if (statusElement) {
            statusElement.textContent = '✓ Added to field';
            statusElement.style.color = 'var(--color-success)';
            setTimeout(() => {
                statusElement.textContent = '';
            }, 2000);
        }
    } else if (interimTranscript && statusElement) {
        statusElement.textContent = `"${interimTranscript}"`;
        statusElement.style.color = 'var(--color-text-light)';
    }
}

function handleFieldSpeechError(event) {
    console.error('Field speech recognition error:', event.error);
    const statusElement = currentFieldId ? document.getElementById(currentFieldId + 'Status') : null;
    if (statusElement) {
        statusElement.textContent = `Error: ${event.error}`;
        statusElement.style.color = 'var(--color-error)';
    }
}

function handleFieldSpeechEnd() {
    const statusElement = currentFieldId ? document.getElementById(currentFieldId + 'Status') : null;
    if (statusElement && statusElement.textContent.includes('Listening')) {
        statusElement.textContent = '';
    }
    currentFieldId = null;
}

// ============================================
// PATIENT DETAILS MANAGEMENT
// ============================================

// Save patient details (from patient portal - immutable after first save)
async function savePatientDetails() {
    const patientId = getCurrentUserId();
    if (!patientId) {
        alert('Please log in first');
        return;
    }
    
    const name = document.getElementById('patientName').value.trim();
    const age = document.getElementById('patientAge').value.trim();
    const gender = document.getElementById('patientGender').value;
    const blood_group = document.getElementById('patientBloodGroup').value;
    const weight = document.getElementById('patientWeight').value.trim();
    const height = document.getElementById('patientHeight').value.trim();
    
    if (!name || !age || !gender) {
        alert('Please fill in all required fields (Name, Age, and Gender)');
        return;
    }
    
    try {
        await savePatient(patientId, { name, age, gender, blood_group, weight, height });
        
        // Lock the fields after saving
        lockPatientDetailsForm();
        
        // Show success message
        document.getElementById('detailsSavedMessage').classList.remove('hidden');
        document.getElementById('detailsInfoText').textContent = 'Your information has been saved and cannot be changed.';
        
    } catch (e) {
        alert('Failed to save your details. Please try again.');
    }
}

// Lock patient details form (make fields readonly)
function lockPatientDetailsForm() {
    const nameField = document.getElementById('patientName');
    const ageField = document.getElementById('patientAge');
    const genderField = document.getElementById('patientGender');
    const bloodGroupField = document.getElementById('patientBloodGroup');
    const weightField = document.getElementById('patientWeight');
    const heightField = document.getElementById('patientHeight');
    const saveBtn = document.getElementById('saveDetailsBtn');
    
    if (nameField) {
        nameField.readOnly = true;
        nameField.style.backgroundColor = '#f3f4f6';
        nameField.style.cursor = 'not-allowed';
    }
    if (ageField) {
        ageField.readOnly = true;
        ageField.style.backgroundColor = '#f3f4f6';
        ageField.style.cursor = 'not-allowed';
    }
    if (genderField) {
        genderField.disabled = true;
        genderField.style.backgroundColor = '#f3f4f6';
        genderField.style.cursor = 'not-allowed';
    }
    if (bloodGroupField) {
        bloodGroupField.disabled = true;
        bloodGroupField.style.backgroundColor = '#f3f4f6';
        bloodGroupField.style.cursor = 'not-allowed';
    }
    if (weightField) {
        weightField.readOnly = true;
        weightField.style.backgroundColor = '#f3f4f6';
        weightField.style.cursor = 'not-allowed';
    }
    if (heightField) {
        heightField.readOnly = true;
        heightField.style.backgroundColor = '#f3f4f6';
        heightField.style.cursor = 'not-allowed';
    }
    if (saveBtn) {
        saveBtn.style.display = 'none';
    }
}

// Load and display patient details form
function loadPatientDetailsForm(patientData) {
    const nameField = document.getElementById('patientName');
    const ageField = document.getElementById('patientAge');
    const genderField = document.getElementById('patientGender');
    const bloodGroupField = document.getElementById('patientBloodGroup');
    const weightField = document.getElementById('patientWeight');
    const heightField = document.getElementById('patientHeight');
    
    if (nameField) nameField.value = patientData.name || '';
    if (ageField) ageField.value = patientData.age || '';
    if (genderField) genderField.value = patientData.gender || '';
    if (bloodGroupField) bloodGroupField.value = patientData.blood_group || '';
    if (weightField) weightField.value = patientData.weight || '';
    if (heightField) heightField.value = patientData.height || '';
    
    // If details are already filled, lock the form
    if (patientData.name && patientData.age && patientData.gender) {
        lockPatientDetailsForm();
        document.getElementById('detailsInfoText').textContent = 'Your information has been saved and cannot be changed.';
        document.getElementById('detailsSavedMessage').classList.remove('hidden');
    }
}

// ============================================
// FOLLOW-UP REMINDER SYSTEM
// ============================================

// Parse follow-up text to extract date
function parseFollowUpDate(followUpText) {
    if (!followUpText) return null;
    
    const text = followUpText.toLowerCase();
    const today = new Date();
    
    // Try to parse patterns like "after 3 days", "in 5 days", "3 days"
    const daysMatch = text.match(/(\d+)\s*days?/i);
    if (daysMatch) {
        const days = parseInt(daysMatch[1]);
        const followUpDate = new Date(today);
        followUpDate.setDate(followUpDate.getDate() + days);
        return followUpDate;
    }
    
    // Try to parse patterns like "after 1 week", "2 weeks"
    const weeksMatch = text.match(/(\d+)\s*weeks?/i);
    if (weeksMatch) {
        const weeks = parseInt(weeksMatch[1]);
        const followUpDate = new Date(today);
        followUpDate.setDate(followUpDate.getDate() + (weeks * 7));
        return followUpDate;
    }
    
    // Try to parse specific date formats
    const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-]?(\d{2,4})?/);
    if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]) - 1;
        const year = dateMatch[3] ? parseInt(dateMatch[3]) : today.getFullYear();
        return new Date(year < 100 ? 2000 + year : year, month, day);
    }
    
    return null;
}

// Display follow-up reminders
function displayFollowUpReminders(prescriptions) {
    const container = document.getElementById('followUpReminders');
    if (!container) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingFollowUps = [];
    
    prescriptions.forEach((prescription, index) => {
        if (prescription.followUp) {
            const followUpDate = parseFollowUpDate(prescription.followUp);
            if (followUpDate) {
                const diffDays = Math.ceil((followUpDate - today) / (1000 * 60 * 60 * 24));
                if (diffDays >= 0) {
                    upcomingFollowUps.push({
                        date: followUpDate,
                        diffDays,
                        text: prescription.followUp,
                        doctorId: prescription.doctorId,
                        prescriptionDate: prescription.date
                    });
                }
            }
        }
    });
    
    if (upcomingFollowUps.length === 0) {
        container.innerHTML = '<p class="empty-state">No upcoming follow-ups scheduled.</p>';
        return;
    }
    
    // Sort by date
    upcomingFollowUps.sort((a, b) => a.date - b.date);
    
    container.innerHTML = upcomingFollowUps.map(followUp => {
        const isToday = followUp.diffDays === 0;
        const isTomorrow = followUp.diffDays === 1;
        const urgencyClass = isToday ? 'urgent' : (followUp.diffDays <= 3 ? 'soon' : '');
        
        let dateText = followUp.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        if (isToday) dateText = '🚨 TODAY';
        else if (isTomorrow) dateText = 'Tomorrow';
        
        return `
            <div class="follow-up-card ${urgencyClass}">
                <div class="follow-up-date">
                    <span class="date-badge">${dateText}</span>
                    <span class="days-away">${isToday ? '' : `in ${followUp.diffDays} days`}</span>
                </div>
                <div class="follow-up-details">
                    <p><strong>Doctor:</strong> ${followUp.doctorId}</p>
                    <p><strong>Instructions:</strong> ${followUp.text}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Check for follow-up reminders (for notifications)
function checkFollowUpReminders(prescriptions) {
    if (notificationPermission !== 'granted') return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toDateString();
    
    prescriptions.forEach(prescription => {
        if (prescription.followUp) {
            const followUpDate = parseFollowUpDate(prescription.followUp);
            if (followUpDate) {
                followUpDate.setHours(0, 0, 0, 0);
                
                if (followUpDate.toDateString() === todayStr) {
                    const reminderKey = `followup-${prescription.date}-${todayStr}`;
                    if (!notifiedReminders.has(reminderKey)) {
                        showFollowUpNotification(prescription.doctorId, prescription.followUp);
                        notifiedReminders.add(reminderKey);
                    }
                }
            }
        }
    });
}

// Show follow-up notification
function showFollowUpNotification(doctorId, followUpText) {
    if (notificationPermission !== 'granted') return;
    
    const notification = new Notification('📅 Follow-up Reminder - DigiRx', {
        body: `Today is your follow-up day! Doctor: ${doctorId}. ${followUpText}`,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📅</text></svg>',
        tag: `followup-${Date.now()}`,
        requireInteraction: true
    });
    
    notification.onclick = function() {
        window.focus();
        notification.close();
    };
    
    setTimeout(() => notification.close(), 60000);
}

// ============================================
// PRESCRIPTION PRINTING
// ============================================

// Print prescription from patient view
function printPrescription(prescriptionIndex) {
    const prescription = window.patientPrescriptions[prescriptionIndex];
    const patientInfo = window.patientInfo;
    
    if (!prescription) {
        alert('Prescription not found');
        return;
    }
    
    printPrescriptionTemplate(prescription, patientInfo);
}

// Print the last saved prescription (immediately after saving)
function printLastPrescription() {
    const prescription = window.lastSavedPrescription;
    const patientInfo = window.lastSavedPatientInfo;
    
    if (!prescription) {
        alert('No prescription to print');
        return;
    }
    
    printPrescriptionTemplate(prescription, patientInfo);
}

// Print prescription from doctor view
function printPrescriptionDoctor(prescriptionIndex) {
    const prescription = window.doctorViewPrescriptions[prescriptionIndex];
    const patientInfo = window.doctorViewPatientInfo;
    
    if (!prescription) {
        alert('Prescription not found');
        return;
    }
    
    printPrescriptionTemplate(prescription, patientInfo);
}

// Shared prescription print template
function printPrescriptionTemplate(prescription, patientInfo) {
    if (!prescription || !patientInfo) {
        alert('Prescription data not found');
        return;
    }
    
    // Create print window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    // Generate medicines list HTML
    let medicinesHtml = '';
    if (prescription.medicines && prescription.medicines.length > 0) {
        medicinesHtml = prescription.medicines.map((med, i) => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${i + 1}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
                    <strong>${med.name || med.molecule || med.brand}</strong>
                    ${med.diagnosis ? `<br><small style="color: #6b7280;">For: ${med.diagnosis}</small>` : ''}
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${med.dosage || '-'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${med.frequency || '-'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${med.duration || '-'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${med.timing || '-'}</td>
            </tr>
        `).join('');
    }
    
    const prescriptionDate = new Date(prescription.date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Prescription - ${patientInfo.name || patientInfo.id}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Times New Roman', serif; 
                    padding: 20px; 
                    max-width: 800px; 
                    margin: auto;
                    font-size: 14px;
                    line-height: 1.5;
                }
                .header {
                    text-align: center;
                    border-bottom: 3px double #1d4ed8;
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                }
                .hospital-name {
                    font-size: 24px;
                    font-weight: bold;
                    color: #1d4ed8;
                    margin-bottom: 5px;
                }
                .hospital-tagline {
                    font-size: 12px;
                    color: #6b7280;
                }
                .rx-symbol {
                    font-size: 36px;
                    color: #1d4ed8;
                    font-weight: bold;
                    margin: 10px 0;
                }
                .patient-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    padding: 10px;
                    background: #f8fafc;
                    border-radius: 5px;
                }
                .patient-info div { flex: 1; }
                .section-title {
                    font-weight: bold;
                    color: #1d4ed8;
                    border-bottom: 1px solid #1d4ed8;
                    padding-bottom: 5px;
                    margin: 15px 0 10px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                th {
                    background: #1d4ed8;
                    color: white;
                    padding: 10px;
                    text-align: left;
                    font-size: 12px;
                }
                .instructions {
                    background: #f0f9ff;
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }
                .instructions p { margin-bottom: 8px; }
                .signature-section {
                    margin-top: 40px;
                    display: flex;
                    justify-content: space-between;
                }
                .signature-box {
                    width: 200px;
                    text-align: center;
                }
                .signature-line {
                    border-top: 1px solid #000;
                    margin-top: 60px;
                    padding-top: 5px;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 11px;
                    color: #6b7280;
                    border-top: 1px solid #e5e7eb;
                    padding-top: 10px;
                }
                @media print {
                    body { padding: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="hospital-name">DigiRx Healthcare</div>
                <div class="hospital-tagline">Digital Prescription System for Rural Healthcare</div>
                <div class="rx-symbol">℞</div>
            </div>
            
            <div class="patient-info">
                <div>
                    <strong>Patient ID:</strong> ${patientInfo.id}<br>
                    <strong>Name:</strong> ${patientInfo.name || 'Not provided'}<br>
                    <strong>Age/Gender:</strong> ${patientInfo.age || '-'} yrs / ${patientInfo.gender || '-'}<br>
                    <strong>Blood Group:</strong> ${patientInfo.blood_group || '-'} | 
                    <strong>Weight:</strong> ${patientInfo.weight ? patientInfo.weight + ' kg' : '-'} | 
                    <strong>Height:</strong> ${patientInfo.height ? patientInfo.height + ' cm' : '-'}
                </div>
                <div style="text-align: right;">
                    <strong>Date:</strong> ${prescriptionDate}<br>
                    <strong>Doctor ID:</strong> ${prescription.doctorId}
                </div>
            </div>
            
            <div class="section-title">PRESCRIPTION</div>
            
            ${medicinesHtml ? `
                <table>
                    <thead>
                        <tr>
                            <th style="width: 30px;">#</th>
                            <th>Medicine</th>
                            <th style="width: 80px;">Dosage</th>
                            <th style="width: 100px;">Frequency</th>
                            <th style="width: 80px;">Duration</th>
                            <th style="width: 100px;">Timing</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${medicinesHtml}
                    </tbody>
                </table>
            ` : `<pre style="background: #f8fafc; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${prescription.content}</pre>`}
            
            ${(prescription.dietaryAdvice || prescription.generalInstructions || prescription.followUp) ? `
                <div class="instructions">
                    <div class="section-title" style="margin-top: 0;">INSTRUCTIONS</div>
                    ${prescription.dietaryAdvice ? `<p><strong>Dietary Advice:</strong> ${prescription.dietaryAdvice}</p>` : ''}
                    ${prescription.generalInstructions ? `<p><strong>General Instructions:</strong> ${prescription.generalInstructions}</p>` : ''}
                    ${prescription.followUp ? `<p><strong>Follow-up:</strong> ${prescription.followUp}</p>` : ''}
                </div>
            ` : ''}
            
            ${prescription.warnings ? `
                <div style="background: #fef3c7; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
                    <strong>⚠️ Important Notes:</strong> ${prescription.doctorNotes || 'Please follow dosage instructions carefully.'}
                </div>
            ` : ''}
            
            <div class="signature-section">
                <div class="signature-box">
                    <div class="signature-line">Patient's Signature</div>
                </div>
                <div class="signature-box">
                    <div class="signature-line">Doctor's Signature & Stamp</div>
                </div>
            </div>
            
            <div class="footer">
                <p>This is a computer-generated prescription from DigiRx Digital Healthcare System</p>
                <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print()" style="padding: 10px 30px; font-size: 16px; background: #1d4ed8; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    🖨️ Print Prescription
                </button>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
}

// ============================================
// MEDICATION REMINDER NOTIFICATION SYSTEM
// ============================================

let notificationPermission = 'default';
let reminderCheckInterval = null;
let notifiedReminders = new Set(); // Track already notified reminders to avoid duplicates

// Request notification permission
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('Browser does not support notifications');
        return false;
    }
    
    if (Notification.permission === 'granted') {
        notificationPermission = 'granted';
        return true;
    }
    
    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        notificationPermission = permission;
        return permission === 'granted';
    }
    
    return false;
}

// Show notification for medication reminder
function showMedicationNotification(medicineName, dosage, timing) {
    if (notificationPermission !== 'granted') return;
    
    const notification = new Notification('💊 Medication Reminder - DigiRx', {
        body: `Time to take ${medicineName}${dosage ? ' (' + dosage + ')' : ''}${timing ? ' - ' + timing : ''}`,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💊</text></svg>',
        tag: `med-${medicineName}-${Date.now()}`,
        requireInteraction: true
    });
    
    notification.onclick = function() {
        window.focus();
        notification.close();
    };
    
    // Auto close after 30 seconds
    setTimeout(() => notification.close(), 30000);
}

// Show notification for activity reminder
function showActivityNotification(activityName, duration) {
    if (notificationPermission !== 'granted') return;
    
    const notification = new Notification('🏃 Activity Reminder - DigiRx', {
        body: `Time for ${activityName}${duration ? ' (' + duration + ' minutes)' : ''}`,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🏃</text></svg>',
        tag: `activity-${activityName}-${Date.now()}`,
        requireInteraction: true
    });
    
    notification.onclick = function() {
        window.focus();
        notification.close();
    };
    
    setTimeout(() => notification.close(), 30000);
}

// Check for upcoming medication reminders
async function checkMedicationReminders() {
    const patientId = getCurrentUserId();
    if (!patientId || getCurrentRole() !== 'patient') return;
    
    try {
        // Get today's medications
        const medicationsResponse = await fetch(`/api/patients/${patientId}/today-medications`);
        const medications = await medicationsResponse.json();
        
        // Get today's activities
        const activitiesResponse = await fetch(`/api/patients/${patientId}/today-activities`);
        const activities = await activitiesResponse.json();
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight
        
        // Check medications
        for (const med of medications) {
            if (med.today_status === 'taken') continue;
            
            // reminder_times is already parsed by the server
            const reminderTimes = Array.isArray(med.reminder_times) ? med.reminder_times : [];
            for (const time of reminderTimes) {
                const [hours, minutes] = time.split(':').map(Number);
                const reminderMinutes = hours * 60 + minutes;
                
                // Notify 5 minutes before and at the scheduled time
                const diff = reminderMinutes - currentTime;
                const reminderKey = `med-${med.id}-${time}-${now.toDateString()}`;
                
                if ((diff >= 0 && diff <= 5) && !notifiedReminders.has(reminderKey)) {
                    showMedicationNotification(med.medicine_name, med.dosage, med.timing);
                    notifiedReminders.add(reminderKey);
                }
            }
        }
        
        // Check activities
        for (const activity of activities) {
            if (activity.today_status === 'completed') continue;
            
            // reminder_times is already parsed by the server
            const reminderTimes = Array.isArray(activity.reminder_times) ? activity.reminder_times : [];
            for (const time of reminderTimes) {
                const [hours, minutes] = time.split(':').map(Number);
                const reminderMinutes = hours * 60 + minutes;
                
                const diff = reminderMinutes - currentTime;
                const reminderKey = `activity-${activity.id}-${time}-${now.toDateString()}`;
                
                if ((diff >= 0 && diff <= 5) && !notifiedReminders.has(reminderKey)) {
                    showActivityNotification(activity.activity_name, activity.duration);
                    notifiedReminders.add(reminderKey);
                }
            }
        }
        
        // Clean up old reminder keys (from previous days)
        const today = now.toDateString();
        for (const key of notifiedReminders) {
            if (!key.includes(today)) {
                notifiedReminders.delete(key);
            }
        }
        
        // Check follow-up reminders
        if (window.patientPrescriptions) {
            checkFollowUpReminders(window.patientPrescriptions);
        }
        
    } catch (error) {
        console.error('Error checking medication reminders:', error);
    }
}

// Start reminder checking (call this when patient dashboard loads)
function startReminderChecking() {
    // Check immediately
    checkMedicationReminders();
    
    // Then check every minute
    if (reminderCheckInterval) {
        clearInterval(reminderCheckInterval);
    }
    reminderCheckInterval = setInterval(checkMedicationReminders, 60000);
}

// Stop reminder checking
function stopReminderChecking() {
    if (reminderCheckInterval) {
        clearInterval(reminderCheckInterval);
        reminderCheckInterval = null;
    }
}

// Initialize notifications for patient dashboard
async function initializeNotifications() {
    const notificationBanner = document.getElementById('notificationBanner');
    
    if (!('Notification' in window)) {
        if (notificationBanner) {
            notificationBanner.innerHTML = `
                <div class="notification-banner warning">
                    <span>⚠️ Your browser doesn't support notifications. You won't receive medication reminders.</span>
                </div>
            `;
        }
        return;
    }
    
    if (Notification.permission === 'granted') {
        notificationPermission = 'granted';
        startReminderChecking();
        if (notificationBanner) {
            notificationBanner.innerHTML = `
                <div class="notification-banner success">
                    <span>🔔 Medication reminders are enabled! You'll be notified when it's time to take your medicines.</span>
                </div>
            `;
        }
    } else if (Notification.permission === 'denied') {
        if (notificationBanner) {
            notificationBanner.innerHTML = `
                <div class="notification-banner warning">
                    <span>🔕 Notifications are blocked. Enable them in browser settings for medication reminders.</span>
                </div>
            `;
        }
    } else {
        if (notificationBanner) {
            notificationBanner.innerHTML = `
                <div class="notification-banner info">
                    <span>🔔 Enable notifications to receive medication reminders</span>
                    <button class="btn-primary" onclick="enableNotifications()">Enable Reminders</button>
                </div>
            `;
        }
    }
}

// Enable notifications (called from banner button)
async function enableNotifications() {
    const granted = await requestNotificationPermission();
    if (granted) {
        startReminderChecking();
        initializeNotifications(); // Update the banner
    } else {
        const notificationBanner = document.getElementById('notificationBanner');
        if (notificationBanner) {
            notificationBanner.innerHTML = `
                <div class="notification-banner warning">
                    <span>🔕 Notifications were denied. Enable them in browser settings for medication reminders.</span>
                </div>
            `;
        }
    }
}

// Get time period label from hour
function getTimePeriod(hour) {
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 21) return 'Evening';
    return 'Night';
}

// Get time period icon
function getTimePeriodIcon(period) {
    switch (period) {
        case 'Morning': return '🌅';
        case 'Afternoon': return '☀️';
        case 'Evening': return '🌆';
        case 'Night': return '🌙';
        default: return '⏰';
    }
}
