import Vicuna7B from '../packages/vicuna-7b/main';

const llm = new Vicuna7B({ logger: console.log, initCallback: console.log });

const form = document.getElementById('form');
const input = document.getElementById('input');
const output = document.getElementById('output');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const prompt = input.value;
  if (prompt !== '') {
    llm.generate(prompt, {
      callback: (step, text) => {
        console.log(step, text);
        output.innerText = text;
      },
    }).then(response => {
      output.innerText = response;
    });
  }
});
