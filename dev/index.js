import Vicuna7B from '../packages/vicuna-7b';

const llm = new Vicuna7B({ logger: console.log, initCallback: console.log });

const form = document.getElementById('form');
const submit = document.getElementById('submit');
const input = document.getElementById('input');
const output = document.getElementById('output');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const prompt = input.value;

  if (prompt !== '' && submit.hasAttribute('disabled') === false) {
    submit.setAttribute('disabled', '');

    llm.generate(prompt, {
      callback: (step, text) => {
        console.log(step, text);
        output.innerText = text;
      },
    }).then(response => {
      output.innerText = response;
      submit.removeAttribute('disabled');
    });
  }
});
