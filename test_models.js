fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyDqsrJEU6wjqxL8l8IPCpoqBoQa4ve1yMo").then(r => r.json()).then(d => {
  const models = d.models.filter(m => m.supportedGenerationMethods.includes('generateContent')).map(m => m.name);
  console.log("AVAILABLE MODELS:", models.join(', '));
}).catch(console.error);
