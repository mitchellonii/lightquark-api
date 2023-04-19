import fetch from "node-fetch"
import EventEmitter from 'events'
import WebSocket from "ws"

import Quark from "./quark.js"
import Channel from "./channel.js"
import User from "./user.js"
import API from "./api.js"

class Message {
    constructor(opts, jwt, ws) {
        this.id = opts.message._id;
        this.websocket = ws;
        this.author = {
            id: opts.author._id,
            username: opts.author.username,
            avatarUri: opts.author.avatarUri
        };
        this.content = opts.message.content;
        this.userAgent = opts.message.ua;
        this.timestamp = opts.message.timestamp;
        this.isEdited = opts.message.edited;
        this.attachments = opts.message.attachments
        this.channelId = opts.message.channelId
        this.isDeleted = false;

        this.edit = async (data) => {
            let a_t = data?.access_token || jwt
            if (a_t == undefined) return { "error": "please enter a access token" }

            let text = data?.text
            if (text == undefined) return { "error": "please enter a text message" }

            let f = await fetch(`https://lq.litdevs.org/v2/channel/${this.channelId}/messages/${this.id}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${a_t}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    "content": text
                })
            })
            let json = await f.json()
            if (json.request.status_code == 200) {
                this.content = text;
                return true
            } else {
                return false
            }
        }
        this.delete = async (data) => {
            let a_t = data?.access_token || jwt
            if (a_t == undefined) return { "error": "please enter a access token" }

            let f = await fetch(`https://lq.litdevs.org/v2/channel/${this.channelId}/messages/${this.id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${a_t}`,
                    "Content-Type": "application/json",
                },

            })
            let json = await f.json()
            if (json.request.status_code == 200) {
                delete this
                this.id = null;
                this.edit = null;
                this.delete = null
                this.isDeleted = true;
            } else {
                return false
            }
        }
    }
}

export default Message