const Discord = require('discord.js')
const express = require('express')
const fetch = require('node-fetch')
const {
    token,
    id,
    secret,
    guildId,
    verifyRole,
    redirectURI,
    port
} = require('./config.json')

const app = express()
const client = new Discord.Client()
const oauthLink = `https://discord.com/api/oauth2/authorize?client_id=821053844271661076&redirect_uri=${encodeURIComponent(`${redirectURI}:${port}/login`)}&response_type=code&scope=identify%20guilds.join`
let authorized = []

app.get('/login', async (req, res) => {
    let params = new URLSearchParams()

    params.set('client_id', id)
    params.set('code', req.query.code)
    params.set('grant_type', 'authorization_code')
    params.set('client_secret', secret)
    params.set('redirect_uri', 'http://localhost:3000/login')

    let discBody = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
            contentType: 'application/x-www-form-urlencoded'
        },
        body: params
    }).then(res => res.json())

    let body = await fetch('https://discord.com/api/users/@me', {
        headers: {
            authorization: `${discBody.token_type} ${discBody.access_token}`,
        },
    }).then(res => res.json())

    let userID = body.id
    let guild = client.guilds.cache.get(guildId)
    authorized.push(userID)

    let addedMember = await guild.addMember(userID, {
        accessToken: discBody.access_token
    }).catch(c => {
        console.log(c)
        console.log(`Could not add ${addedMember} to ${guild.name}`)
    })

    addedMember.roles.add(verifyRole).catch(c => {
        console.log(`Could not add roles to ${addedMember}`)
    })

    addedMember.send("Thank you for verifying")

    res.redirect(`https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
})

app.listen(3000, () => {
    console.log(`App listening on port 3000`)
})

client.on('ready', () => {
    console.log(`${client.user.username} is ready to verify people!`)
})

client.on('guildMemberAdd', async member => {
    if(authorized.includes(member.id)) return;
    await member.send(new Discord.MessageEmbed()
        .setColor("YELLOW")
        .setTitle("Attention!!")
        .setDescription(`You have been kicked from ${member.guild} to prevent alts! \nIn order to join back, please click on [this link](${oauthLink}) and authorize your account to our bot.\nOnce you do so, you will be able to join the guild!\n`)
        .setFooter(client.user.username, client.user.displayAvatarURL())
        .setAuthor(member.user.tag, member.user.displayAvatarURL())
    ).catch(c => console.log(`${member.user.username} has DM's disabled`))

    member.kick().catch(c => {})
})

client.login(token)