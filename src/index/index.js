import './style.scss';

// ES6+ syntax examples
const name = 'Webpack 5';
const age = 5;
const isNew = true;

// Arrow function
const greet = () => {
  return `Hello from ${name}!`;
};

// Template literals
const message = `
  ${greet()}
  Age: ${age}
  Is new: ${isNew}
`;

// Async/await
async function fetchData() {
  try {
    // Simulate API call
    const response = await new Promise((resolve) => {
      setTimeout(() => resolve({ data: 'Success!' }), 1000);
    });
    console.log('Data:', response.data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Class
class Person {
  constructor(name) {
    this.name = name;
  }

  sayHello() {
    return `Hello, my name is ${this.name}`;
  }
}

// Usage
const person = new Person('John');
console.log(person.sayHello());

// Spread operator
const numbers = [1, 2, 3];
const newNumbers = [...numbers, 4, 5];
console.log('New numbers:', newNumbers);

// Optional chaining
const user = { name: 'Alice', address: { city: 'New York' } };
const city = user?.address?.city;
console.log('City:', city);

// Nullish coalescing
const defaultValue = user?.age ?? 18;
console.log('Default age:', defaultValue);

// DOM manipulation
const app = document.getElementById('app');
app.innerHTML = `
  <div class="container">
    <h2>${message}</h2>
    <button id="btn">Click Me</button>
  </div>
`;

// Event listener
document.getElementById('btn').addEventListener('click', () => {
  fetchData();
  alert('Button clicked!');
});

console.log('Index page loaded');
