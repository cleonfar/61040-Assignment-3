async function testNoHighPerformersAI() {
    console.log('\n🧪 TEST: AI Summary (No High Performers)');
    const config = loadConfig();
    const llm = new GeminiLLM(config);
    const da = new DataAnalysis();
    // All animals are average or low, none are high performers
    const animals: Animal[] = [
        {
            id: 'A1',
            sex: Sex.Female,
            species: 'sheep',
            weightRecords: [
                { date: '2025-01-01', weightKg: 30 },
                { date: '2025-02-01', weightKg: 32 },
                { date: '2025-03-01', weightKg: 33 }
            ],
            reproductiveRecords: []
        },
        {
            id: 'A2',
            sex: Sex.Male,
            species: 'sheep',
            weightRecords: [
                { date: '2025-01-01', weightKg: 28 },
                { date: '2025-02-01', weightKg: 29 },
                { date: '2025-03-01', weightKg: 29.5 }
            ],
            reproductiveRecords: []
        }
    ];
    const report = da.generateReport(animals, ReportType.Weight);
    const summary = await da.getSummary(report, llm);
    let parsed;
    try {
        parsed = JSON.parse(summary);
    } catch (e) {
        const match = summary.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                parsed = JSON.parse(match[0]);
            } catch (e2) {
                throw new Error('AI summary (no high performers) is not valid JSON, even after extraction!');
            }
        } else {
            throw new Error('AI summary (no high performers) is not valid JSON and no JSON object found!');
        }
    }
    if (!Array.isArray(parsed.highPerformers)) throw new Error('Missing highPerformers in no high performers summary');
    if (parsed.highPerformers.length !== 0) throw new Error('AI should not fill highPerformers if none fit!');
    console.log('✅ AI summary correctly left highPerformers empty when none fit.');
}

async function testNoLowPerformersAI() {
    console.log('\n🧪 TEST: AI Summary (No Low Performers)');
    const config = loadConfig();
    const llm = new GeminiLLM(config);
    const da = new DataAnalysis();
    // All animals are average or high, none are low performers
    const animals: Animal[] = [
        {
            id: 'A1',
            sex: Sex.Female,
            species: 'sheep',
            weightRecords: [
                { date: '2025-01-01', weightKg: 30 },
                { date: '2025-02-01', weightKg: 38 },
                { date: '2025-03-01', weightKg: 45 }
            ],
            reproductiveRecords: []
        },
        {
            id: 'A2',
            sex: Sex.Male,
            species: 'sheep',
            weightRecords: [
                { date: '2025-01-01', weightKg: 28 },
                { date: '2025-02-01', weightKg: 36 },
                { date: '2025-03-01', weightKg: 44 }
            ],
            reproductiveRecords: []
        }
    ];
    const report = da.generateReport(animals, ReportType.Weight);
    const summary = await da.getSummary(report, llm);
    let parsed;
    try {
        parsed = JSON.parse(summary);
    } catch (e) {
        const match = summary.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                parsed = JSON.parse(match[0]);
            } catch (e2) {
                throw new Error('AI summary (no low performers) is not valid JSON, even after extraction!');
            }
        } else {
            throw new Error('AI summary (no low performers) is not valid JSON and no JSON object found!');
        }
    }
    if (!Array.isArray(parsed.lowPerformers)) throw new Error('Missing lowPerformers in no low performers summary');
    if (parsed.lowPerformers.length !== 0) throw new Error('AI should not fill lowPerformers if none fit!');
    console.log('✅ AI summary correctly left lowPerformers empty when none fit.');
}
async function testWeightRecordErrorAI() {
    console.log('\n🧪 TEST: AI Summary (Weight Record Error)');
    const config = loadConfig();
    const llm = new GeminiLLM(config);
    const da = new DataAnalysis();
    // Animal with a likely typo in weight (500kg instead of 50kg)
    const animals: Animal[] = [
        {
            id: 'LAMB1',
            sex: Sex.Male,
            species: 'sheep',
            weightRecords: [
                { date: '2025-01-01', weightKg: 25 },
                { date: '2025-02-01', weightKg: 32 },
                { date: '2025-03-01', weightKg: 500 } // typo: should be 50
            ],
            reproductiveRecords: []
        },
        {
            id: 'LAMB2',
            sex: Sex.Female,
            species: 'sheep',
            weightRecords: [
                { date: '2025-01-01', weightKg: 24 },
                { date: '2025-02-01', weightKg: 31 },
                { date: '2025-03-01', weightKg: 38 }
            ],
            reproductiveRecords: []
        }
    ];
    const report = da.generateReport(animals, ReportType.Weight);
    const summary = await da.getSummary(report, llm);
    console.log('Weight record error report results:\n' + report.results);
    console.log('AI summary (weight record error):\n' + summary);
    let parsed;
    try {
        parsed = JSON.parse(summary);
    } catch (e) {
        // Try to extract JSON substring if extra text is present
        const match = summary.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                parsed = JSON.parse(match[0]);
            } catch (e2) {
                throw new Error('AI summary (weight record error) is not valid JSON, even after extraction!');
            }
        } else {
            throw new Error('AI summary (weight record error) is not valid JSON and no JSON object found!');
        }
    }
    // Do not check the content of insights, just ensure it is present as a string
    if (typeof parsed.insights !== 'string') throw new Error('Missing insights in weight record error summary');
    // Check that the correct animal ID is in potentialRecordErrors
    if (!Array.isArray(parsed.potentialRecordErrors)) throw new Error('Missing potentialRecordErrors array in summary');
    if (!parsed.potentialRecordErrors.includes('LAMB1')) throw new Error('LAMB1 (500kg weight typo) not flagged in potentialRecordErrors!');
    console.log('✅ AI summary flagged weight record error (typo) in potentialRecordErrors.');
}
// --- Test Animal Generators ---
function makeTestAnimals(): Animal[] {
    return [
        {
            id: 'A1',
            sex: Sex.Female,
            species: 'sheep',
            weightRecords: [
                { date: '2025-01-01', weightKg: 30 },
                { date: '2025-02-01', weightKg: 38 },
                { date: '2025-03-01', weightKg: 45 }
            ],
            reproductiveRecords: [
                {
                    type: 'birth',
                    date: '2025-02-10',
                    motherId: 'A1',
                    offspringIds: ['L1', 'L2'],
                    count: 2
                },
                {
                    type: 'weaning',
                    date: '2025-04-10',
                    motherId: 'A1',
                    offspringIds: ['L1', 'L2'],
                    count: 2
                }
            ]
        },
        {
            id: 'A2',
            sex: Sex.Male,
            species: 'sheep',
            weightRecords: [
                { date: '2025-01-10', weightKg: 28 },
                { date: '2025-03-10', weightKg: 40 }
            ],
            reproductiveRecords: []
        },
        {
            id: 'A3',
            sex: Sex.Unknown,
            species: 'sheep',
            weightRecords: [],
            reproductiveRecords: []
        }
    ];
}

function makeSmallTestAnimals(): Animal[] {
    return [
        {
            id: 'A1',
            sex: Sex.Female,
            species: 'sheep',
            weightRecords: [
                { date: '2025-01-01', weightKg: 30 },
                { date: '2025-02-01', weightKg: 38 },
                { date: '2025-03-01', weightKg: 45 }
            ],
            reproductiveRecords: []
        },
        {
            id: 'A2',
            sex: Sex.Male,
            species: 'sheep',
            weightRecords: [
                { date: '2025-01-10', weightKg: 28 },
                { date: '2025-03-10', weightKg: 40 }
            ],
            reproductiveRecords: []
        }
    ];
}

function makeLargeTestAnimals(): Animal[] {
    return [
        // High performer
        {
            id: 'HP1',
            sex: Sex.Female,
            species: 'sheep',
            weightRecords: [
                { date: '2025-01-01', weightKg: 32 },
                { date: '2025-02-01', weightKg: 44 },
                { date: '2025-03-01', weightKg: 55 }
            ],
            reproductiveRecords: []
        },
        // Low performer
        {
            id: 'LP1',
            sex: Sex.Male,
            species: 'sheep',
            weightRecords: [
                { date: '2025-01-01', weightKg: 30 },
                { date: '2025-03-01', weightKg: 33 }
            ],
            reproductiveRecords: []
        },
        // Concerning trend (weight loss)
        {
            id: 'CT1',
            sex: Sex.Female,
            species: 'sheep',
            weightRecords: [
                { date: '2025-01-01', weightKg: 36 },
                { date: '2025-02-01', weightKg: 34 },
                { date: '2025-03-01', weightKg: 32 }
            ],
            reproductiveRecords: []
        },
        // Concerning trend (sharp drop in gain)
        {
            id: 'CT2',
            sex: Sex.Male,
            species: 'sheep',
            weightRecords: [
                { date: '2025-01-01', weightKg: 31 },
                { date: '2025-02-01', weightKg: 39 },
                { date: '2025-03-01', weightKg: 41 }
            ],
            reproductiveRecords: []
        },
        // Normal performer
        {
            id: 'N1',
            sex: Sex.Unknown,
            species: 'sheep',
            weightRecords: [
                { date: '2025-01-01', weightKg: 33 },
                { date: '2025-03-01', weightKg: 41 }
            ],
            reproductiveRecords: []
        },
        // More animals for scale
        ...Array.from({ length: 6 }, (_, i) => ({
            id: `X${i+1}`,
            sex: Sex.Male,
            species: 'sheep',
            weightRecords: [
                { date: '2025-01-01', weightKg: 30 + i },
                { date: '2025-03-01', weightKg: 38 + i }
            ],
            reproductiveRecords: []
        }))
    ];
}
import { DataAnalysis, Animal, Sex, ReportType, WeightRecord, ReproductiveRecord } from './dataAnalysis';
import { GeminiLLM, Config } from './gemini-llm';
// --- AI Summary Test Helpers ---
function loadConfig(): Config {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const config = require('../config.json');
        return config;
    } catch (error) {
        throw new Error('Error loading config.json: ' + (error as Error).message);
    }
}





export async function testReportGenerationAndSearch() {
    console.log('\n🧪 TEST: Report Generation and Search');
    const animals = makeTestAnimals();
    const da = new DataAnalysis();


    // Generate a weight report
    const weightReport = da.generateReport(animals, ReportType.Weight);
    console.log('Generated weight report:', weightReport.name);
    console.log('Weight report results:\n' + weightReport.results);

    // Generate a reproductive report
    const reproReport = da.generateReport(animals, ReportType.Reproductive);
    console.log('Generated reproductive report:', reproReport.name);
    console.log('Reproductive report results:\n' + reproReport.results);
    // Validate reproductiveStats
    if (!reproReport.reproductiveStats || !Array.isArray(reproReport.reproductiveStats)) {
        throw new Error('Missing reproductiveStats in reproductive report');
    }
    // Should have stats for mother A1
    const a1Stats = reproReport.reproductiveStats.find(s => s.motherId === 'A1');
    if (!a1Stats) throw new Error('No stats for mother A1 in reproductiveStats');
    if (a1Stats.avgBirthed !== 2) throw new Error('Incorrect avgBirthed for A1');
    if (a1Stats.avgWeaned !== 2) throw new Error('Incorrect avgWeaned for A1');
    if (a1Stats.totalBirths !== 2) throw new Error('Incorrect totalBirths for A1');
    if (a1Stats.totalWeaned !== 2) throw new Error('Incorrect totalWeaned for A1');

    // Search for the weight report by name
    let foundWeight;
    try {
        foundWeight = da.getReport(weightReport.name);
        console.log('Search for weight report:', foundWeight ? 'Found' : 'Not found');
    } catch (e) {
        throw new Error('Weight report not found by name!');
    }

    // Search for the reproductive report by name
    let foundRepro;
    try {
        foundRepro = da.getReport(reproReport.name);
        console.log('Search for reproductive report:', foundRepro ? 'Found' : 'Not found');
    } catch (e) {
        throw new Error('Reproductive report not found by name!');
    }

    // Search for a non-existent report
    let notFound = false;
    try {
        da.getReport('Nonexistent Report');
        notFound = true;
    } catch (e) {
        notFound = false;
        console.log('Search for non-existent report: Not found');
    }
    if (notFound) throw new Error('Should not find a non-existent report!');

    console.log('✅ All report generation and search tests passed!');
}

async function testReproductiveAISummary() {
    console.log('\n🧪 TEST: AI Summary (Reproductive Report)');
    const config = loadConfig();
    const llm = new GeminiLLM(config);
    const da = new DataAnalysis();
    // Two mothers, one high, one low performer
    const animals: Animal[] = [
        {
            id: 'M1',
            sex: Sex.Female,
            species: 'sheep',
            reproductiveRecords: [
                { type: 'birth', date: '2025-01-01', motherId: 'M1', offspringIds: ['O1', 'O2', 'O3'], count: 3 },
                { type: 'weaning', date: '2025-03-01', motherId: 'M1', offspringIds: ['O1', 'O2', 'O3'], count: 3 },
                { type: 'birth', date: '2025-06-01', motherId: 'M1', offspringIds: ['O4', 'O5'], count: 2 },
                { type: 'weaning', date: '2025-08-01', motherId: 'M1', offspringIds: ['O4', 'O5'], count: 2 }
            ]
        },
        {
            id: 'M2',
            sex: Sex.Female,
            species: 'sheep',
            reproductiveRecords: [
                { type: 'birth', date: '2025-01-01', motherId: 'M2', offspringIds: ['O6'], count: 1 },
                { type: 'weaning', date: '2025-03-01', motherId: 'M2', offspringIds: ['O6'], count: 1 }
            ]
        },
        {
            id: 'M3',
            sex: Sex.Female,
            species: 'sheep',
            reproductiveRecords: [
                { type: 'birth', date: '2025-01-01', motherId: 'M3', offspringIds: ['O7', 'O8'], count: 2 },
                { type: 'weaning', date: '2025-03-01', motherId: 'M3', offspringIds: ['O7'], count: 1 } // concerning: only 1 weaned
            ]
        }
    ];
    const report = da.generateReport(animals, ReportType.Reproductive);
    const summary = await da.getSummary(report, llm);
    console.log('Reproductive report results:\n' + report.results);
    console.log('AI summary (repro):\n' + summary);
    let parsed;
    try {
        parsed = JSON.parse(summary);
    } catch (e) {
        // Try to extract JSON substring if extra text is present
        const match = summary.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                parsed = JSON.parse(match[0]);
            } catch (e2) {
                throw new Error('AI summary (repro) is not valid JSON, even after extraction!');
            }
        } else {
            throw new Error('AI summary (repro) is not valid JSON and no JSON object found!');
        }
    }
    // Validate structure
    if (!parsed.highPerformers || !Array.isArray(parsed.highPerformers)) throw new Error('Missing highPerformers in repro summary');
    if (!parsed.lowPerformers || !Array.isArray(parsed.lowPerformers)) throw new Error('Missing lowPerformers in repro summary');
    if (!parsed.concerningTrends || !Array.isArray(parsed.concerningTrends)) throw new Error('Missing concerningTrends in repro summary');
    if (!parsed.averagePerformers || !Array.isArray(parsed.averagePerformers)) throw new Error('Missing averagePerformers in repro summary');
    // Do not check the content of insights, just ensure it is present as a string
    if (typeof parsed.insights !== 'string') throw new Error('Missing insights in repro summary');
    // Ensure all IDs are mother IDs
    const allMothers = ['M1', 'M2', 'M3'];
    for (const cat of ['highPerformers', 'lowPerformers', 'concerningTrends', 'averagePerformers']) {
        for (const id of parsed[cat]) {
            if (!allMothers.includes(id)) throw new Error(`Unexpected mother ID ${id} in ${cat}`);
        }
    }
    // Additional check: no extra animals/mothers in summary
    const allSummaryIds = new Set([
        ...parsed.highPerformers,
        ...parsed.lowPerformers,
        ...parsed.concerningTrends,
        ...parsed.averagePerformers
    ]);
    for (const id of allSummaryIds) {
        if (!allMothers.includes(id)) {
            throw new Error(`AI summary includes ID not in report: ${id}`);
        }
    }
    // Ensure exclusivity
    const allCats = [
        ...(parsed.highPerformers || []),
        ...(parsed.lowPerformers || []),
        ...(parsed.concerningTrends || []),
        ...(parsed.averagePerformers || [])
    ];
    const seen = new Set();
    for (const id of allCats) {
        // Allow overlap only between lowPerformers and concerningTrends
        const inLow = parsed.lowPerformers.includes(id);
        const inConcerning = parsed.concerningTrends.includes(id);
        const inHigh = parsed.highPerformers.includes(id);
        const inAvg = parsed.averagePerformers.includes(id);
        if ((inHigh && (inLow || inConcerning || inAvg)) || (inAvg && (inHigh || inLow || inConcerning))) {
            throw new Error(`Mother ${id} appears in both high/average and another category in AI summary!`);
        }
        if ((inLow || inConcerning) && !(inHigh || inAvg)) {
            // allowed overlap
            continue;
        }
        if (seen.has(id)) {
            throw new Error(`Mother ${id} appears in more than one disallowed category in AI summary!`);
        }
        seen.add(id);
    }
    console.log('✅ AI summary JSON structure, mother IDs, and category exclusivity validated for reproductive report.');
}

async function testReproductiveInconsistenciesAI() {
    console.log('\n🧪 TEST: AI Summary (Reproductive Inconsistencies)');
    const config = loadConfig();
    const llm = new GeminiLLM(config);
    const da = new DataAnalysis();
    // Mother with weaning but no birth, and mother weaning more than birthed
    const animals: Animal[] = [
        {
            id: 'M1',
            sex: Sex.Female,
            species: 'sheep',
            reproductiveRecords: [
                { type: 'weaning', date: '2025-03-01', motherId: 'M1', offspringIds: ['O1', 'O2'], count: 2 }
            ]
        },
        {
            id: 'M2',
            sex: Sex.Female,
            species: 'sheep',
            reproductiveRecords: [
                { type: 'birth', date: '2025-01-01', motherId: 'M2', offspringIds: ['O3'], count: 1 },
                { type: 'weaning', date: '2025-03-01', motherId: 'M2', offspringIds: ['O3', 'O4'], count: 2 }
            ]
        }
    ];
    const report = da.generateReport(animals, ReportType.Reproductive);
    const summary = await da.getSummary(report, llm);
    console.log('Reproductive inconsistencies report results:\n' + report.results);
    console.log('AI summary (inconsistencies):\n' + summary);
    let parsed;
    try {
        parsed = JSON.parse(summary);
    } catch (e) {
        // Try to extract JSON substring if extra text is present
        const match = summary.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                parsed = JSON.parse(match[0]);
            } catch (e2) {
                throw new Error('AI summary (inconsistencies) is not valid JSON, even after extraction!');
            }
        } else {
            throw new Error('AI summary (inconsistencies) is not valid JSON and no JSON object found!');
        }
    }
    // Do not check the content of insights, just ensure it is present as a string
    if (typeof parsed.insights !== 'string') throw new Error('Missing insights in inconsistencies summary');
    // Check that the correct animal IDs are in potentialRecordErrors
    if (!Array.isArray(parsed.potentialRecordErrors)) throw new Error('Missing potentialRecordErrors array in summary');
    if (!parsed.potentialRecordErrors.includes('M1')) throw new Error('Mother M1 (weaning without birth) not flagged in potentialRecordErrors!');
    if (!parsed.potentialRecordErrors.includes('M2')) throw new Error('Mother M2 (weaning more than birthed) not flagged in potentialRecordErrors!');
    console.log('✅ AI summary flagged reproductive record inconsistencies in insights and potentialRecordErrors.');
}

if (require.main === module) {
    testReportGenerationAndSearch()
        .then(async () => {
            // --- AI Summary Tests ---
            console.log('\n🧪 TEST: AI Summary (Small Set)');
            const config = loadConfig();
            const llm = new GeminiLLM(config);
            const da = new DataAnalysis();
            const smallAnimals = makeSmallTestAnimals();
            const smallReport = da.generateReport(smallAnimals, ReportType.Weight);
            const smallSummary = await da.getSummary(smallReport, llm);
            console.log('Small set report results:\n' + smallReport.results);
            console.log('AI summary (small set):\n' + smallSummary);
            let parsedSmall;
            try {
                parsedSmall = JSON.parse(smallSummary);
            } catch (e) {
                // Try to extract JSON substring if extra text is present
                const match = smallSummary.match(/\{[\s\S]*\}/);
                if (match) {
                    try {
                        parsedSmall = JSON.parse(match[0]);
                    } catch (e2) {
                        throw new Error('AI summary (small set) is not valid JSON, even after extraction!');
                    }
                } else {
                    throw new Error('AI summary (small set) is not valid JSON and no JSON object found!');
                }
            }
            if (!parsedSmall.highPerformers || !Array.isArray(parsedSmall.highPerformers)) throw new Error('Missing highPerformers in small set summary');
            if (!parsedSmall.lowPerformers || !Array.isArray(parsedSmall.lowPerformers)) throw new Error('Missing lowPerformers in small set summary');
            if (!parsedSmall.concerningTrends || !Array.isArray(parsedSmall.concerningTrends)) throw new Error('Missing concerningTrends in small set summary');
            if (!parsedSmall.averagePerformers || !Array.isArray(parsedSmall.averagePerformers)) throw new Error('Missing averagePerformers in small set summary');
            // Do not check the content of insights, just ensure it is present as a string
            if (typeof parsedSmall.insights !== 'string') throw new Error('Missing insights in small set summary');

            console.log('\n🧪 TEST: AI Summary (Large Set)');
            const largeAnimals = makeLargeTestAnimals();
            const largeReport = da.generateReport(largeAnimals, ReportType.Weight);
            const largeSummary = await da.getSummary(largeReport, llm);
            console.log('Large set report results:\n' + largeReport.results);
            console.log('AI summary (large set):\n' + largeSummary);
            let parsedLarge;
            try {
                parsedLarge = JSON.parse(largeSummary);
            } catch (e) {
                // Try to extract JSON substring if extra text is present
                const match = largeSummary.match(/\{[\s\S]*\}/);
                if (match) {
                    try {
                        parsedLarge = JSON.parse(match[0]);
                    } catch (e2) {
                        throw new Error('AI summary (large set) is not valid JSON, even after extraction!');
                    }
                } else {
                    throw new Error('AI summary (large set) is not valid JSON and no JSON object found!');
                }
            }
            if (!parsedLarge.highPerformers || !Array.isArray(parsedLarge.highPerformers)) throw new Error('Missing highPerformers in large set summary');
            if (!parsedLarge.lowPerformers || !Array.isArray(parsedLarge.lowPerformers)) throw new Error('Missing lowPerformers in large set summary');
            if (!parsedLarge.concerningTrends || !Array.isArray(parsedLarge.concerningTrends)) throw new Error('Missing concerningTrends in large set summary');
            if (!parsedLarge.averagePerformers || !Array.isArray(parsedLarge.averagePerformers)) throw new Error('Missing averagePerformers in large set summary');
            // Do not check the content of insights, just ensure it is present as a string
            if (typeof parsedLarge.insights !== 'string') throw new Error('Missing insights in large set summary');

            // Check that expected animals are present in the correct categories for large set
            const expectHigh = ['HP1'];
            const expectLow = ['LP1'];
            const expectConcerning = ['CT1', 'CT2'];
            for (const id of expectHigh) {
                if (!parsedLarge.highPerformers.includes(id)) throw new Error(`Expected high performer ${id} not found in summary`);
            }
            for (const id of expectLow) {
                if (!parsedLarge.lowPerformers.includes(id)) throw new Error(`Expected low performer ${id} not found in summary`);
            }
            for (const id of expectConcerning) {
                if (!parsedLarge.concerningTrends.includes(id)) throw new Error(`Expected concerning trend ${id} not found in summary`);
            }

            // Ensure no animal is classified into more than one category
            const allCats = [
                ...(parsedLarge.highPerformers || []),
                ...(parsedLarge.lowPerformers || []),
                ...(parsedLarge.concerningTrends || []),
                ...(parsedLarge.averagePerformers || [])
            ];
            const seen = new Set();
            for (const id of allCats) {
                if (seen.has(id)) {
                    throw new Error(`Animal ${id} appears in more than one category in AI summary!`);
                }
                seen.add(id);
            }
            console.log('✅ AI summary JSON structure, key animal IDs, and category exclusivity validated.');

            await testWeightRecordErrorAI();
            await testNoHighPerformersAI();
            await testNoLowPerformersAI();
            await testReproductiveAISummary();
            await testReproductiveInconsistenciesAI();
        })
        .catch(e => {
            console.error('❌ Test failed:', e.message);
            process.exit(1);
        });
}
