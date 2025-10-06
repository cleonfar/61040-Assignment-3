<concept_spec>
concept DataAnalysis [Animal, Herd]  
  purpose generate summaries, comparisons, and trends based on recorded animal and herd data  
  principle  
    a user selects an individual animal or herd to generate a report;  
    queries performance records such as weight and growth rate;  
    analyzes reproductive outcomes including offspring counts and survivability;  
    and views aggregated results to support operational decisions.  

state  
a set of GeneratedReports with  
    a name String
    a reportType Enum [growth, reproduction]  
    a dateGenerated Date  
    a target Animal or Herd  
    a set of results (key-value pairs or tabular data)  

actions  
generateReport (reportType: Enum, target: Animal or Herd): (report: GeneratedReport)  
    effects: produce a report based on the specified parameters and store the results  
             names the report based on the date and report type.

viewReport (report: GeneratedReport): (results: GeneratedReport)  
    requires: report exists  
    effects: return the summary and results of the report  

listReports (): (reports: Set<GeneratedReport>)  
    effects: return all generated reports  

deleteReport (report: GeneratedReport)  
    requires: report exists and belongs to the user  
    effects: remove the report from the system  

aiSummary

askAI

</concept_spec>