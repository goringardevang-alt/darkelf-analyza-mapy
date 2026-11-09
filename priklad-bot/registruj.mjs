// Jednorázová registrace příkazu /mapa na serveru. Token se bere z proměnné prostředí, nikdy ho nepiš do souboru.
// DISCORD_TOKEN=... APP_ID=... GUILD_ID=... node priklad-bot/registruj.mjs
const { DISCORD_TOKEN, APP_ID, GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !APP_ID || !GUILD_ID) throw new Error('Chybí DISCORD_TOKEN, APP_ID nebo GUILD_ID.');
const prikazy = [{
  name: 'mapa', description: 'Shrnutí mapy za uložený den',
  options: [{ type: 4, name: 'den', description: 'Herní den (bez něj poslední)', required: false }],
}];
const r = await fetch(`https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`, {
  method: 'PUT', headers: { Authorization: `Bot ${DISCORD_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(prikazy),
});
console.log(r.status, await r.text());
