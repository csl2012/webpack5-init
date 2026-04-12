import './style.scss';

// ES6+ syntax examples
const aboutContent = {
  title: 'About This Project',
  description: 'This is a webpack 5 project with multi-page configuration.',
  features: [
    'Webpack 5',
    'ES6+ support',
    'Core-js polyfills',
    'Sass support',
    'Multi-page setup',
  ],
};

// Destructuring
const { title, description, features } = aboutContent;

// Map function
const featuresList = features.map((feature) => `<li>${feature}</li>`).join('');

// DOM manipulation
const content = document.getElementById('about-content');
content.innerHTML = `
  <div class="about-container">
    <h2>${title}</h2>
    <p>${description}</p>
    <h3>Features:</h3>
    <ul>${featuresList}</ul>
    <button id="back-btn">Go Back</button>
  </div>
`;

// Event listener
document.getElementById('back-btn').addEventListener('click', () => {
  window.location.href = 'index.html';
});

// Promise example
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

delay(1000).then(() => {
  console.log('About page loaded after 1 second');
});

console.log('About page loaded');
