[Link to code](dataAnalysis.ts)
[Link to tests](dataAnalysis-tests.ts)
[Link to UI sketches](UISketches.png)
[Link to Original Spec](DataAnalysisOrig.Spec)
[Link to AI Spec](DataAnalysisAI.Spec)

## User Journey

A user has the reports on the the performance of their livestock, but does not want to take the time to go over
all the information provided in the report. They turn to the AI summary feature. With it they can see at a glance
which animals are performing particularly well, and which are struggling. They can also look to the insights
feature of the summary to get an overview of how the herd is doing and get suggestions on how to address
low performance.  


## Test Cases

1. Added some test cases with a larger number of animals, to make sure the AI could correctly pick out the 
important stuff from a larger set. This caused some issues with the formatting of the AI response, so
I had to change the prompt to be stricter on the format of the AI response. This was also what made me
add a section for average performers to the AI summary response, because the AI seemed to want to classify
every animal as something, so it designated most as low performers, which was not what I was looking for.  

2. Added some test cases with obvious data inconsistencies to see if the AI would correctly identify this
as weird. I added to the prompt that it should include a section in the summary for potential record errors.  
I also had to update the prompt to make sure it classifies every animal into one of the fields. That didn't
actually do as much as I had hoped.  
I ended up having to make the prompt tell the AI to be highly suspious of potentially errant records in order
for it to correctly classify an obviously incorrect record as a potential error.  
Building on this I made a test case to see if the AI would flag impossibly good performance as suspicious, which
it did not. Changed the prompt to list of some of the things that it should identify as potential record errors.  
There are still record errors that it still only sometimes feels are weird enough to warrant being classes as
potential record errors.  

3. Added a test case with no high performers and another with no low performers to make sure the AI summary
wouldn't want to classify something as a high or low performer just to fill everything up.  
I was a bit surprised that this didn't seem to cause any issues for the AI.  

## Validators
One potential issue that I thought could happen is the AI response on the summary could fail to correctly
identify animals that are obviously high or low performers as such, so a test case was made for both types of
reports to ensure the AI was correctly identifying these. Another validator checks to make sure the AI summary
doesn't somehow decide to put the same animal into multiple categories, with the exception that low performers
could also be classed as showing a concerning trend, because I think there can be some overlap between those
two types. Another validator ensures that the AI summary only includes animals that are actually in the report.  