const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../server/src/db/seed.ts');
let content = fs.readFileSync(file, 'utf8');

const filterWords = [
  "Oxxo",
  "torta de tamal",
  "señor de los elotes",
  "corrido",
  "chile",
  "mariachi",
  "quebradita",
  "torta ahogada",
  "fila del SAT",
  "Chapulín Colorado",
  "mural de Rivera",
  "pesos",
  "Enchiladas",
  "quesadillas",
  "Chavo",
  "mezcal",
  "sinaloense",
  "Catemaco",
  "comal",
  "PRI ",
  "Tecate",
  "Tortillas",
  "vochito",
  "horchata",
  "pozole",
  "elote",
  "Cantinflas",
  "chipilín",
  "Tepito",
  "Tijuana",
  "michelada",
  "tianguis",
  "payaso de rodeo",
  "atole"
];

// Process line by line
const lines = content.split('\n');
const newLines = lines.filter(line => {
  // if it's a white card or black card definition line
  if (line.includes('{ text: "El ingrediente secreto de las enchiladas')) {
      return false; // we'll just remove the black card too
  }
  
  if (line.match(/^\s*".+",?$/)) {
    // it's a white card
    for (const word of filterWords) {
      if (line.toLowerCase().includes(word.toLowerCase())) {
        return false;
      }
    }
  }
  return true;
});

fs.writeFileSync(file, newLines.join('\n'));
console.log('Filtered out Mexican references.');
