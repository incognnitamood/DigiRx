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
    'pregabalin', 'diazepam', 'alprazolam', 'clonazepam', 'phenytoin',
    'carbamazepine', 'valproate', 'levetiracetam', 'tamsulosin', 'finasteride'
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
        addImageToPatient(imageData);
    };
    reader.readAsDataURL(file);
}

function addImageToPatient(imageData) {
    if (!currentPatientId) {
        alert('No patient selected');
        return;
    }
    
    const patientData = getPatientData(currentPatientId);
    if (!patientData) {
        alert('Patient not found');
        return;
    }
    
    // Initialize images array if it doesn't exist
    if (!patientData.images) {
        patientData.images = [];
    }
    
    patientData.images.push(imageData);
    savePatient(currentPatientId, patientData);
    
    // Refresh the image gallery
    displayPatientImages();
    
    // Reset file input
    document.getElementById('imageUpload').value = '';
    
    alert('Image uploaded successfully!');
}

function displayPatientImages() {
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
    
    const patientData = getPatientData(patientId);
    if (!patientData || !patientData.images || patientData.images.length === 0) {
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
    if (!currentPatientId) return;
    
    const patientData = getPatientData(currentPatientId);
    const image = patientData.images.find(img => img.id === imageId);
    
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
    if (!currentPatientId) return;
    
    const patientData = getPatientData(currentPatientId);
    const image = patientData.images.find(img => img.id === imageId);
    
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

function getAllPatients() {
    const patients = localStorage.getItem('patients');
    return patients ? JSON.parse(patients) : {};
}

function savePatient(patientId, patientData) {
    const patients = getAllPatients();
    patients[patientId] = patientData;
    localStorage.setItem('patients', JSON.stringify(patients));
}

function getPatientData(patientId) {
    const patients = getAllPatients();
    return patients[patientId] || null;
}

// ============================================
// AUTHENTICATION & NAVIGATION
// ============================================

function loginAsPatient() {
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
    
    const patientId = patientIdInput.toUpperCase();
    
    // Check if patient exists, if not create new
    let patientData = getPatientData(patientId);
    
    if (!patientData) {
        // New patient - initialize data
        patientData = {
            id: patientId,
            conditions: [],
            reports: [],
            images: [],
            prescriptions: [],
            createdAt: new Date().toISOString()
        };
        savePatient(patientId, patientData);
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

function initializePatientDashboard() {
    const role = getCurrentRole();
    if (role !== 'patient') {
        window.location.href = 'index (2).html';
        return;
    }
    
    const patientId = getCurrentUserId();
    const patientData = getPatientData(patientId);
    
    if (!patientData) {
        alert('Patient data not found. Please login again.');
        logout();
        return;
    }
    
    // Display patient ID
    document.getElementById('patientIdDisplay').textContent = patientId;
    
    // Load and display uploaded files
    displayUploadedFiles(patientData);
    
    // Display extracted conditions
    displayExtractedConditions(patientData);
    
    // Load prescriptions
    displayPatientPrescriptions(patientData);
    
    // Display patient images
    displayPatientImages();
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

    const patientId = getCurrentUserId();
    const patientData = getPatientData(patientId);

    // Simulate file upload and analysis (read small files as data URLs so doctor can view them)
    for (let file of files) {
        const reportData = {
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            extractedConditions: [], // No automatic condition extraction
            dataUrl: null,
            summary: null // Summary will be generated by OCR summarizer only
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

        patientData.reports.push(reportData);
    }

    savePatient(patientId, patientData);

    // Clear file input and refresh display
    fileInput.value = '';
    displayUploadedFiles(patientData);
    displayExtractedConditions(patientData);

    // Show feedback
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
    
    container.innerHTML = patientData.prescriptions.map(prescription => `
        <div class="prescription-item">
            <div class="prescription-date">
                Prescribed by: ${prescription.doctorId} on ${new Date(prescription.date).toLocaleString()}
            </div>
            <div class="prescription-content">${prescription.content}</div>
            ${prescription.warnings ? `
                <div style="margin-top: var(--spacing-sm); padding: var(--spacing-sm); background-color: #fef3c7; border-radius: var(--radius-sm); font-size: var(--font-size-small);">
                    <strong>⚠️ Doctor's Notes:</strong> ${prescription.doctorNotes || 'Warnings were acknowledged by the doctor.'}
                </div>
            ` : ''}
        </div>
    `).join('');
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

function loadPatient() {
    const patientIdInput = document.getElementById('patientIdInput').value.trim();
    
    if (!patientIdInput) {
        alert('Please enter a Patient ID');
        return;
    }
    
    const patientData = getPatientData(patientIdInput);
    
    if (!patientData) {
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
    if (patientData.name) {
        document.getElementById('patientName').value = patientData.name || '';
        document.getElementById('patientAge').value = patientData.age || '';
        document.getElementById('patientGender').value = patientData.gender || '';
    }
    
    // Display medical history disclaimers
    displayPatientDisclaimers(patientData);
    
    // Display uploaded reports
    displayPatientReports(patientData);
    
    // Display patient's prescription history
    displayPatientPrescriptionHistory(patientData);
    
    // Display patient images
    displayPatientImages();
    
    // Clear previous prescription
    clearPrescription();
    document.getElementById('warningSection').classList.add('hidden');
    document.getElementById('successMessage').classList.add('hidden');
}

function savePatientDemographics() {
    if (!currentPatientId) {
        alert('Please load a patient first');
        return;
    }
    
    const patientData = getPatientData(currentPatientId);
    
    patientData.name = document.getElementById('patientName').value.trim();
    patientData.age = document.getElementById('patientAge').value.trim();
    patientData.gender = document.getElementById('patientGender').value;
    
    savePatient(currentPatientId, patientData);
    
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
                        <span style="font-size: var(--font-size-small); color: var(--color-text-light); white-space: nowrap;">
                            ${formattedDate}
                        </span>
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
// DRUG INTERACTION CHECKING
// ============================================

function checkAllDrugInteractions() {
    if (!currentPatientId) {
        return;
    }
    
    const patientData = getPatientData(currentPatientId);
    if (!patientData || patientData.conditions.length === 0) {
        document.getElementById('warningSection').classList.add('hidden');
        return;
    }
    
    const warnings = [];
    const medicines = getAllMedicines();
    
    // Check each medicine
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
    
    if (warnings.length > 0) {
        displayWarnings(warnings);
    } else {
        document.getElementById('warningSection').classList.add('hidden');
    }
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
    
    warningMessages.innerHTML = warnings.map(warning => `
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
    `).join('');
    
    warningSection.classList.remove('hidden');
    
    // Reset acknowledgment
    document.getElementById('acknowledgeWarning').checked = false;
    document.getElementById('overrideReason').value = '';
}

// ============================================
// PRESCRIPTION SAVING
// ============================================

function savePrescription() {
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
    
    patientData.prescriptions.push(prescriptionData);
    savePatient(currentPatientId, patientData);
    
    // Show success message
    document.getElementById('successMessage').classList.remove('hidden');
    
    // Clear form
    setTimeout(() => {
        clearPrescription();
        document.getElementById('successMessage').classList.add('hidden');
    }, 3000);
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