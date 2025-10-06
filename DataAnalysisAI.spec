<concept_spec>
concept DataAnalysis

purpose
    generate reports based on recorded animal and herd data to help guide analysis
    and herd decisions

principle
    a user selects an individual animal or herd to generate a report;
    queries performance records such as weight or reproductive outcomes;  
    views the resulting report to form operational decisions;
    the user can request an ai summary of the report to identify trends and key takeaways;

state  
    a set of GeneratedReports with  
      a report name String
      a reportType Enum [growth, reproduction]  
      a dateGenerated Date  
      a target Animal or Herd  
      a set of results (key-value pairs or tabular data)  


actions  
generateReport (user: User, reportType: Enum, filters: Set<Filter>, metrics: Set<Enum>): (report: GeneratedReport)  
    effects: produce a report based on the specified parameters and store the results  

viewReport (report: GeneratedReport): (results: GeneratedReport)  
    requires: report exists  
    effects: return the summary and results of the report  

listReports (): (reports: Set<GeneratedReport>)  
    effects: return all generated reports  

deleteReport (report: GeneratedReport)  
    requires: report exists
    effects: remove the report from the system

aiSummary (report: GeneratedReport): (summary: String)
    requires: report exists
    effects: The ai takes the report and gives a summary of the report, highlighting key
             takeaways and trends shown in the report.

    
</concept_spec>