import fetch from "node-fetch"
import EventEmitter from 'events'
import WebSocket from "ws"

import Quark from "./quark.js"
import Channel from "./channel.js"
import User from "./user.js"
import Message from "./message.js"

class API {
    constructor(opts) {
        this.readyState = 0;
        this.email = opts?.email || undefined;
        this.password = opts?.password || undefined;
        this.access_token = opts?.access_token || undefined;
        this.websocket = {
            connected: false,
            connect: async (data) => {
                return new Promise((res, rej) => {
                    if (this.websocket.connected == true) return rej();
                    let a_t = data?.access_token || this.access_token
                    if (a_t == undefined) return { "error": "please enter a access token" }
                    this.websocket.rawsocket = new WebSocket("wss://lq-gateway.litdevs.org", a_t)
                    this.websocket.rawsocket.onopen = () => {
                        this.websocket.connected = true;
                        setInterval(() => {
                            this.websocket.rawsocket.send(JSON.stringify({ heartbeat: "hello! - from blamequark-lq-api@0.1" }))
                        }, 3000)
                        res(true);
                    }
                    this.websocket.rawsocket.onclose = () => {
                        this.websocket.connected = false;
                        alert("websocket dead. blamequark will now shit itself. please refresh")
                        this.websocket.rawsocket = undefined;
                        rej(false)
                    }
                    this.websocket.rawsocket.onerror = (e) => {
                        this.websocket.connected = false;
                        alert(e)
                        rej(false)
                    }
                })
            },
            rawsocket: undefined
        }
        this.fetchToken = async (data) => {
            var [email, password] = [data?.email || this.email, data?.password || this.password];
            if (email == undefined || password == undefined) return { "error": "please enter a email and password" }
            let f = await fetch("https://lq.litdevs.org/v1/auth/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email: email, password: password })
            })
            let json = await f.json()
            if (json.request.status_code == 200) {
                return { "access_token": json.response.access_token }
            } else {
                return json
            }
        }
        this.login = async (data) => {
            var [email, password] = [data?.email || this.email, data?.password || this.password];
            if (email == undefined || password == undefined) return { "error": "please enter a email and password" }
            let f = await fetch("https://lq.litdevs.org/v1/auth/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email: email, password: password })
            })
            let json = await f.json()
            if (json.request.status_code == 200) {
                this.access_token = json.response.access_token
                return true
            } else {
                return json.request
            }
        }


        this.getUserInfo = async (data) => {
            let a_t = data?.access_token || this.access_token
            if (a_t == undefined) return { "error": "please enter a access token" }


            if (data?.id != undefined) {
                let f = await fetch(`https://lq.litdevs.org/v1/user/${data.id}`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${a_t}`
                    },
                })
                let json = await f.json()
                if (json.request.status_code == 200) {
                    return new User(json.response.user, this.access_token)
                } else {
                    return json
                }
            } else {
                let f = await fetch("https://lq.litdevs.org/v1/user/me", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${a_t}`
                    },
                })
                let json = await f.json()
                if (json.request.status_code == 200) {
                    return new User(json.response.jwtData, this.access_token)
                } else {
                    return json
                }
            }
        }


        this.getMyQuarks = async (data) => {
            let a_t = data?.access_token || this.access_token
            if (a_t == undefined) return { "error": "please enter a access token" }



            let f = await fetch(`https://lq.litdevs.org/v1/quark/me`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${a_t}`
                },
            })
            let json = await f.json()
            if (json.request.status_code == 200) {
                return json.response.quarks.map(q => new Quark(q, this.access_token, this.websocket))
            } else {
                return json
            }


        }
        this.getQuark = async (data) => {
            let a_t = data?.access_token || this.access_token
            if (a_t == undefined) return { "error": "please enter a access token" }

            let id = data?.id
            if (id == undefined) return { "error": "please enter a quark id" }

            let f = await fetch(`https://lq.litdevs.org/v2/quark/${id}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${a_t}`
                },
            })
            let json = await f.json()
            if (json.request.status_code == 200) {
                return new Quark(json.response.quark, this.access_token, this.websocket)
            } else {
                return json
            }

        }

        this.createQuark = async (data) => {
            let a_t = data?.access_token || this.access_token
            if (a_t == undefined) return { "error": "please enter a access token" }

            let name = data?.name
            if (name == undefined) return { "error": "please enter a quark name" }

            let f = await fetch(`https://lq.litdevs.org/v1/quark/create`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${a_t}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name: name })
            })
            let json = await f.json()
            if (json.request.status_code == 200) {
                return new Quark(json.response.quark, this.access_token, this.websocket)
            } else {
                return json
            }
        }

        this.deleteQuark = async (data) => {
            let a_t = data?.access_token || this.access_token
            if (a_t == undefined) return { "error": "please enter a access token" }

            let id = data?.id
            if (id == undefined) return { "error": "please enter a quark id" }

            let f = await fetch(`https://lq.litdevs.org/v1/quark/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${a_t}`,
                },
            })
            let json = await f.json()
            if (json.request.status_code == 200) {
                return json.response
            } else {
                return json
            }
        }
        this.updateQuark = async (data) => {
            let a_t = data?.access_token || this.access_token
            if (a_t == undefined) return { "error": "please enter a access token" }

            let id = data?.id
            if (id == undefined) return { "error": "please enter a quark id" }

            let f = await fetch(`https://lq.litdevs.org/v1/quark/${id}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${a_t}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "name": data?.name,
                    "owners": data?.owners,
                    "invite": data?.invite
                })
            })
            let json = await f.json()
            if (json.request.status_code == 200) {
                return json.response
            } else {
                return json
            }
        }
        this.getNick = async (data) => {
            let a_t = data?.access_token || this.access_token
            if (a_t == undefined) return { "error": "please enter a access token" }

            let id = data?.id || "global"
            let f = await fetch(`https://lq.litdevs.org/v2/user/me/nick/${id}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${a_t}`,
                },
            })
            let json = await f.json()
            if (json.request.status_code == 200) {
                return json.response.nickname
            } else {
                return json
            }
        }
        this.setGlobalNick = async (data) => {
            let a_t = data?.access_token || this.access_token
            if (a_t == undefined) return { "error": "please enter a access token" }

            let nick = data?.nick
            if (nick == undefined) return { "error": "please enter a nickname" }
            let f = await fetch(`https://lq.litdevs.org/v2/user/me/nick/`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${a_t}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ "scope": "global", "nickname": nick })
            })
            let json = await f.json()
            if (json.request.status_code == 200) {
                return true
            } else {
                return json.request.status_code
            }
        }
        this.getAvatar = async (data) => {
            let a_t = data?.access_token || this.access_token
            if (a_t == undefined) return { "error": "please enter a access token" }

            let f = await fetch(`https://lq.litdevs.org/v1/user/me/avatar`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${a_t}`,
                },
            })
            let json = await f.text()
            return json

        }
        this.deleteAvatar = async (data) => {
            let a_t = data?.access_token || this.access_token
            if (a_t == undefined) return { "error": "please enter a access token" }

            let f = await fetch(`https://lq.litdevs.org/v1/user/me/avatar`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${a_t}`,
                },
            })
            let json = await f.json()
            if (json.request.status_code = 200) {
                return true
            } else {
                return json.request.status_code
            }

        }
        this.setAvatar = async (data) => {
            let a_t = data?.access_token || this.access_token
            if (a_t == undefined) return { "error": "please enter a access token" }

            let datablob = data?.data
            if (datablob == undefined) return { "error": "please enter avatar data" }

            let f = await fetch(`https://lq.litdevs.org/v1/user/me/avatar`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${a_t}`,
                    "Content-Type": "image/png"
                },
                body: datablob
            })
            let json = await f.json()
            if (json.request.status_code = 200) {
                return true
            } else {
                return json.request.status_code
            }
        }
        this.checkInvite = async (data) => {
            let a_t = data?.access_token || this.access_token
            if (a_t == undefined) return { "error": "please enter a access token" }

            let invite = data?.invite
            if (invite == undefined) return { "error": "please enter invite" }

            let f = await fetch(`https://lq.litdevs.org/v1/quark/invite/${invite}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${a_t}`,
                },
            })
            let json = await f.json()
            if (json.request.status_code = 200) {
                return true
            } else {
                return json.request.status_code
            }
        }
        this.joinInvite = async (data) => {
            let a_t = data?.access_token || this.access_token
            if (a_t == undefined) return { "error": "please enter a access token" }

            let invite = data?.invite
            if (invite == undefined) return { "error": "please enter invite" }

            let f = await fetch(`https://lq.litdevs.org/v1/quark/invite/${invite}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${a_t}`,
                },
            })
            let json = await f.json()
            if (json.request.status_code = 200) {
                return true
            } else {
                return json.request.status_code
            }
        }

        this.messageListener = async (data) => {
            let a_t = data?.access_token || this.access_token
            if (a_t == undefined) return { "error": "please enter a access token" }
            var ee = new EventEmitter()

            let mq = await this.getMyQuarks(data)
            for (var q of mq) {
                let msgsListner = q.subscribeUpdates()
                msgsListner.on("newMessage", data => {
                    ee.emit("newMessage", data)
                })
            }
            return ee
        }
    }
}

export default API