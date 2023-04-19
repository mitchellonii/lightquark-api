import fetch from "node-fetch"
import EventEmitter from 'events'
import WebSocket from "ws"


import Message from "./message.js"
import Channel from "./channel.js"
import User from "./user.js"
import API from "./api.js"

class Quark {
    constructor(opts, jwt, ws) {
        this.id = opts._id;
        this.name = opts.name;
        this.iconUri = opts.iconUri;
        this.emotes = opts.emotes;
        this.roles = opts.roles;
        this.bans = opts.bans;
        this.invite = opts.invite;
        this.memberIds = opts.members;
        this.channels = opts.channels.map(c => new Channel(c, jwt, ws))
        this.ownerIds = opts.owners
        this.websocket = ws


        Object.defineProperty(this, "delete", {
            enumerable: false,
            writable: true
        });
        Object.defineProperty(this, "createChannel", {
            enumerable: false,
            writable: true
        });
        this.delete = async () => {
            let f = await fetch(`https://lq.litdevs.org/v1/quark/${this.id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${jwt}`,
                },
            })
            let json = await f.json()
            if (json.request.status_code == 200) {
                return json.response
            } else {
                return json
            }

        }
        this.createChannel = async (data) => {
            let a_t = data?.access_token || jwt
            if (a_t == undefined) return { "error": "please enter a access token" }

            let name = data?.name
            if (name == undefined) return { "error": "please enter a channel name" }

            let f = await fetch(`https://lq.litdevs.org/v1/channel/create`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${a_t}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ quark: this.id, name: data.name })
            })
            let json = await f.json()
            if (json.request.status_code == 200) {
                return new Channel(json.response.channel, jwt, ws)
            } else {
                return json
            }
        }
        this.subscribeUpdates = () => {
            if (this.websocket.rawsocket == undefined) return false;
            var ee = new EventEmitter()

            for (let c of this.channels) {
                this.websocket.rawsocket.send(JSON.stringify({ "event": "subscribe", "message": `channel_${c.id}` }))
            }
            this.websocket.rawsocket.addEventListener("message", (msg) => {
                let data = JSON.parse(msg.data)
                if (data.eventId == "messageCreate" && this.channels.map(c => c.id).includes(data.message.channelId)) {
                    ee.emit("newMessage", { quark: this, message: data })
                }
            })
            return ee

        }
    }
}

export default Quark