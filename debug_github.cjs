const https = require('https');

https.get('https://api.github.com/repos/hayaledd/telepromter/actions/runs', { headers: { 'User-Agent': 'node.js' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const runs = JSON.parse(data).workflow_runs;
    if(!runs || runs.length === 0) return console.log("No runs found");
    const latest = runs[0];
    console.log(`Latest Run: ${latest.name} - ${latest.status} - ${latest.conclusion}`);
    
    https.get(latest.jobs_url, { headers: { 'User-Agent': 'node.js' } }, (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => {
        const jobs = JSON.parse(data2).jobs;
        const failedSteps = jobs.map(j => ({
            name: j.name, 
            id: j.id,
            failed_steps: j.steps.filter(s => s.conclusion === 'failure')
        })).filter(j => j.failed_steps.length > 0);
        
        console.log("Failed Jobs:", JSON.stringify(failedSteps, null, 2));

        if (failedSteps.length > 0) {
            const jobId = failedSteps[0].id;
            console.log(`Fetching logs for job ${jobId}...`);
            https.get(`https://api.github.com/repos/hayaledd/telepromter/actions/jobs/${jobId}/logs`, { headers: { 'User-Agent': 'node.js' } }, (res3) => {
                if (res3.statusCode === 302) {
                    https.get(res3.headers.location, (res4) => {
                        let logData = '';
                        res4.on('data', chunk => logData += chunk);
                        res4.on('end', () => {
                            const lines = logData.split('\n');
                            const lastLines = lines.slice(-50).join('\n');
                            console.log('LOGS:\n', lastLines);
                        });
                    });
                } else {
                    console.log('Failed to fetch logs, status:', res3.statusCode);
                }
            });
        }
      });
    });
  });
});
