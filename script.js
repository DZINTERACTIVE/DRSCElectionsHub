const states = [
  { name: "Alabama", initials: "AL", ev: 9 },
  { name: "Alaska", initials: "AK", ev: 3 },
  { name: "Arizona", initials: "AZ", ev: 11 },
  { name: "Arkansas", initials: "AR", ev: 6 },
  { name: "California", initials: "CA", ev: 54 },
  { name: "Colorado", initials: "CO", ev: 10 },
  { name: "Connecticut", initials: "CT", ev: 7 },
  { name: "Delaware", initials: "DE", ev: 3 },
  { name: "Florida", initials: "FL", ev: 30 },
  { name: "Georgia", initials: "GA", ev: 16 }
];

const map = document.getElementById('map');

states.forEach(state => {
  const stateDiv = document.createElement('div');
  stateDiv.className = 'state';
  stateDiv.innerHTML = `
    <span>${state.initials}</span>
    <span>${state.ev}</span>
  `;
  map.appendChild(stateDiv);
});
