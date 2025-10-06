// Enum for report types
export enum ReportType {
    Weight = 'Weight',
    Reproductive = 'Reproductive',
}

// Weight record structure
export interface WeightRecord {
    date: string; // ISO date string
    weightKg: number;
}

// Reproductive record types
export type ReproductiveRecord = BirthRecord | WeaningRecord;

export interface BirthRecord {
    type: 'birth';
    date: string; // ISO date string
    motherId: string;
    offspringIds: string[];
    count: number;
}

export interface WeaningRecord {
    type: 'weaning';
    date: string; // ISO date string
    motherId: string;
    offspringIds: string[];
    count: number;
}


// Enum for animal sex
export enum Sex {
    Male = 'Male',
    Female = 'Female',
    Unknown = 'Unknown'
}

// Animal record
export interface Animal {
    id: string;
    sex: Sex;
    species: string; // e.g., 'sheep', 'cattle', etc.
    weightRecords?: WeightRecord[];
    reproductiveRecords?: ReproductiveRecord[];
}

export interface WeightGainInterval {
    fromDate: string;
    toDate: string;
    fromWeight: number;
    toWeight: number;
    days: number;
    averageDailyGain: number;
}

export interface Report {
    animalIds: string[];
    reportType: ReportType;
    results: string;
    name: string;
    summaryAI?: string;
    // Only for weight reports
    weightGains?: { animalId: string; gains?: WeightGainInterval[]; note?: string }[];
    // Only for reproductive reports
    reproductiveStats?: { motherId: string; avgBirthed: number; avgWeaned: number; totalBirths: number; totalWeaned: number }[];
    // Add more type-specific fields as needed
}

import { GeminiLLM } from './gemini-llm';

export class DataAnalysis {
    private reports: Report[] = [];

    /**
     * Get or generate (with AI) a summary for a report. Caches the summary in the report.
     */
    async getSummary(report: Report, llm: GeminiLLM): Promise<string> {
        if (report.summaryAI) {
            return report.summaryAI;
        }
        const summary = await this.makeSummary(report, llm);
        report.summaryAI = summary;
        return summary;
    }

    /**
     * Use AI to generate a summary of a report, highlighting high/low performers and trends.
     * @param report The report to summarize
     * @param llm An instance of GeminiLLM or compatible AI class
     * @returns Promise<string> summary
     */
    async makeSummary(report: Report, llm: GeminiLLM): Promise<string> {
        const prompt = `You are an expert livestock analyst. Given the following report, respond ONLY with valid JSON in this exact format:
        {
            "highPerformers": ["animalId1", ...],
            "lowPerformers": ["animalId2", ...],
            "concerningTrends": ["animalId3", ...],
            "averagePerformers": ["animalId4", ...],
            "potentialRecordErrors": ["animalId5", ...],
            "insights": "A few short paragraphs (2-3) with deeper analysis: summarize the most important findings, discuss possible causes for low performance or concerning trends, and suggest practical management or intervention strategies for these cases. Do not focus on average/moderate performers, but do mention if the overall average performance of the group stands out as particularly good or bad."
        }
        Do not include any explanation, commentary, or text before or after the JSON. Only output valid JSON. If you cannot determine a category, return an empty array for that field. Only include animals/mothers in 'averagePerformers' if they are not in any other category. Every animal in the report must be classified into at least one of the following categories: highPerformers, lowPerformers, concerningTrends, averagePerformers, or potentialRecordErrors. No animal should be left unclassified.

    Be highly suspicious of questionable or inconsistent records. Be liberal about classifying something as a potential record error: if there is any reasonable doubt or anything seems odd, include the animal or mother in 'potentialRecordErrors' and mention the issue in 'insights'. Do not hesitate to flag records that seem unusual or inconsistent.

    Here are some examples of suspicious or potentially erroneous records:
    - A mother having more weaned than birthed
    - Weaning records without a corresponding birth record
    - Negative or impossible values (e.g., negative weights, negative gains, or negative counts)
    - Impossibly high or low numbers for the species or age (e.g., a lamb weighing 500kg, or a newborn with an adult weight)
    - Obvious typos (such as an extra zero, misplaced decimal, or swapped digits)
    - Duplicate or missing records
    - Any other data that seems inconsistent, out of range, or highly unlikely
    Mark records as a potential record error if they may include a typo or if the values are impossibly good or bad for the species or age. Err on the side of caution and flag anything that could possibly be a record error.

    Absolutely ensure that every animal or mother you think might have a record error is included in the 'potentialRecordErrors' array—no exceptions. If you mention or suspect a record error for an animal or mother in your analysis, their ID must appear in 'potentialRecordErrors'.

        Report data:
        ${JSON.stringify(report, null, 2)}

        JSON Summary:`;
        const summary = await llm.executeLLM(prompt);
        return summary.trim();
    }

    /**
     * Generate a single report for a group of animals and a report type.
     * The report contains a summary and details for all animals.
     */
    generateReport(animals: Animal | Animal[], reportType: ReportType): Report {
        const animalList = Array.isArray(animals) ? animals : [animals];
    let results = '';
    let weightGains: { animalId: string; gains?: WeightGainInterval[]; note?: string }[] = [];
    let reproductiveStats: { motherId: string; avgBirthed: number; avgWeaned: number; totalBirths: number; totalWeaned: number }[] = [];

        if (reportType === ReportType.Weight) {
            results = 'Weight Report for Animals:';
            for (const animal of animalList) {
                if (animal.weightRecords && animal.weightRecords.length > 1) {
                    const sortedRecords = [...animal.weightRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    const gains: WeightGainInterval[] = [];
                    for (let i = 1; i < sortedRecords.length; i++) {
                        const prev = sortedRecords[i - 1];
                        const curr = sortedRecords[i];
                        const prevDate = new Date(prev.date);
                        const currDate = new Date(curr.date);
                        const days = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
                        if (days > 0) {
                            const gain = (curr.weightKg - prev.weightKg) / days;
                            gains.push({
                                fromDate: prev.date,
                                toDate: curr.date,
                                fromWeight: prev.weightKg,
                                toWeight: curr.weightKg,
                                days: Number(days.toFixed(2)),
                                averageDailyGain: Number(gain.toFixed(4)),
                            });
                        }
                    }
                    if (gains.length > 0) {
                        results += `\n- ${animal.id}: ${gains.map(g => `${g.fromDate} to ${g.toDate}: ${g.averageDailyGain} kg/day`).join('; ')}`;
                        weightGains.push({ animalId: animal.id, gains });
                    } else {
                        results += `\n- ${animal.id}: Not enough data to calculate gains.`;
                        weightGains.push({ animalId: animal.id, note: 'Not enough data to calculate gains.' });
                    }
                } else if (animal.weightRecords && animal.weightRecords.length === 1) {
                    results += `\n- ${animal.id}: Only one weight record; cannot calculate daily gain.`;
                    weightGains.push({ animalId: animal.id, note: 'Only one weight record; cannot calculate daily gain.' });
                } else {
                    results += `\n- ${animal.id}: No weight records.`;
                    weightGains.push({ animalId: animal.id, note: 'No weight records.' });
                }
            }
        } else if (reportType === ReportType.Reproductive) {
            results = 'Reproductive Report for Mothers:';
            // Aggregate by mother
            const motherStats: Record<string, { births: number[]; weaned: number[] }> = {};
            for (const animal of animalList) {
                if (animal.reproductiveRecords && animal.reproductiveRecords.length > 0) {
                    for (const rec of animal.reproductiveRecords) {
                        if (rec.type === 'birth') {
                            if (!motherStats[rec.motherId]) motherStats[rec.motherId] = { births: [], weaned: [] };
                            motherStats[rec.motherId].births.push(rec.count);
                        } else if (rec.type === 'weaning') {
                            if (!motherStats[rec.motherId]) motherStats[rec.motherId] = { births: [], weaned: [] };
                            motherStats[rec.motherId].weaned.push(rec.count);
                        }
                    }
                }
            }
            for (const motherId in motherStats) {
                const stats = motherStats[motherId];
                const totalBirths = stats.births.reduce((a, b) => a + b, 0);
                const totalWeaned = stats.weaned.reduce((a, b) => a + b, 0);
                const avgBirthed = stats.births.length > 0 ? totalBirths / stats.births.length : 0;
                const avgWeaned = stats.weaned.length > 0 ? totalWeaned / stats.weaned.length : 0;
                reproductiveStats.push({ motherId, avgBirthed, avgWeaned, totalBirths, totalWeaned });
                results += `\n- ${motherId}: avg birthed = ${avgBirthed.toFixed(2)}, avg weaned = ${avgWeaned.toFixed(2)}, total births = ${totalBirths}, total weaned = ${totalWeaned}`;
            }
            if (reproductiveStats.length === 0) {
                results += '\nNo reproductive records found.';
            }
        }

        // Generate report name based on date and type
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
        let baseName = `${dateStr}_${reportType} Report`;
        let name = baseName;
        let i = 1;
        while (this.reports.some(r => r.name === name)) {
            name = `${baseName} (${i})`;
            i++;
        }

        let report: Report;
        if (reportType === ReportType.Weight) {
            report = {
                animalIds: animalList.map(a => a.id),
                reportType: ReportType.Weight,
                results,
                name,
                weightGains
            };
        } else {
            report = {
                animalIds: animalList.map(a => a.id),
                reportType: ReportType.Reproductive,
                results,
                name,
                reproductiveStats
            };
        }
        this.reports.push(report);
        return report;
    }

    /**
     * Get all stored reports, or filter by animalId or reportType
     */
    getReports(options?: { animalId?: string; reportType?: ReportType }): Report[] {
        if (!options) return [...this.reports];
        return this.reports.filter(r =>
            (options.animalId ? r.animalIds.includes(options.animalId) : true) &&
            (options.reportType ? r.reportType === options.reportType : true)
        );
    }

    /**
     * Get a report by name. Throws a helpful error if not found.
     */
    getReport(name: string): Report {
        const report = this.reports.find(r => r.name === name);
        if (!report) {
            throw new Error(`No report found with the name: "${name}". Please check the report name and try again.`);
        }
        return report;
    }

    /**
     * Start an expert AI chat session about a report. Returns a function that takes a user question and returns the AI's answer.
     * The AI is instructed to act as a livestock expert and answer questions about the provided report.
     * @param report The report to discuss
     * @param llm An instance of GeminiLLM or compatible AI class
     * @returns (question: string) => Promise<string>
     */
    getReportExpertChat(report: Report, llm: GeminiLLM) {
        // Conversation history: array of {role: 'user'|'assistant', content: string}
        const history: { role: 'user' | 'assistant'; content: string }[] = [];
        // System prompt
        const systemPrompt = `You are an expert livestock analyst. You have access to the following report data:\n${JSON.stringify(report, null, 2)}\n\nYou will answer questions as an expert, providing clear, concise, and actionable information. If a question is outside the scope of the report, politely explain what information is available.`;
        // Add system prompt as first message
        history.push({ role: 'user', content: systemPrompt });
        // Return a function that takes a user question and returns the AI's answer
        return async (question: string): Promise<string> => {
            history.push({ role: 'user', content: question });
            // Compose the conversation as a single prompt (for simple LLMs)
            const prompt = history.map(h => (h.role === 'user' ? `User: ${h.content}` : `Expert: ${h.content}`)).join('\n');
            const answer = await llm.executeLLM(prompt);
            history.push({ role: 'assistant', content: answer });
            return answer.trim();
        };
    }

    /**
     * Clear all stored reports
     */
    clearReports(): void {
        this.reports = [];
    }
}
