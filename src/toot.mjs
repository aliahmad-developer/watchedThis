import { readFileSync } from 'fs';
const sa = JSON.parse(readFileSync('fyp-movie-4d46d-firebase-adminsdk-fbsvc-2a77296a5a.json', 'utf8'));
console.log(sa.private_key);