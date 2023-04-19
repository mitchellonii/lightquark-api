import fetch from "node-fetch"
import EventEmitter from 'events'
import WebSocket from "ws"

import Quark from "./quark.js"
import Message from "./message.js"
import User from "./user.js"
import API from "./api.js"

class Channel {
    constructor(opts, jwt, ws) {
        this.websocket = ws;
        this.id = opts._id;
        this.name = opts.name;
        this.description = opts.description;
        this.quark = opts.quark

        if (typeof opts == "string") this.id = opts;

        this.send = async (data) => {
            let a_t = data?.access_token || jwt
            if (a_t == undefined) return { "error": "please enter a access token" }

            let text = data?.text
            if (text == undefined) return { "error": "please enter a text message" }

            let f = await fetch(`https://lq.litdevs.org/v2/channel/${this.id}/messages
            `, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${a_t}`,
                    "Content-Type": "application/json",
                    "lq-agent": "Blamequark-react"
                },
                body: JSON.stringify({
                    "content": text
                })
            })
            let json = await f.json()
            if (json.request.status_code == 200) {
                return (new Message(json.response.message, jwt, ws))
            } else {
                return json
            }
        }
        this.messages = []
        this.getMessages = async (data) => {
            let a_t = data?.access_token || jwt
            if (a_t == undefined) return { "error": "please enter a access token" }


            let f = await fetch(`https://lq.litdevs.org/v1/channel/${this.id}/messages`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${a_t}`,
                },
            })
            let json = await f.json()
            if (json.request.status_code == 200) {
                this.messages = this.messages.concat(json.response.messages);
                this.messages = [...new Map(this.messages.map(item => [item.message._id, item])).values()].map((d) => { return new Message(d, jwt, ws) })
                return (json.response.messages.map((d) => { return new Message(d, jwt, ws) }))
            } else {
                return json
            }
        }
        this.subscribeUpdates = () => {
            if (this.websocket.rawsocket == undefined) return false;
            this.websocket.rawsocket.send(JSON.stringify({ "event": "subscribe", "message": `channel_${this.id}` }))
            var ee = new EventEmitter()

            this.websocket.rawsocket.onmessage = (msg) => {
                let data = JSON.parse(msg.data)
                if (data.eventId == "messageCreate" && data.message.channelId == this.id) {
                    let newMsg = new Message(data.message, jwt, ws)
                    this.messages.push(newMsg);
                    ee.emit('messageListUpdate', { list: this.messages, addition: newMsg })
                }
            }
            return ee

        }
    }
}

export default Channel