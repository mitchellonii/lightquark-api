import API from "../src/index.js"




//login using credentials and store the session in the API object
async function authMethod1() {
    const api = new API()
    let loggedIn = await api.login({ email: "example@email.com", password: "asdfghjkl" })
    if (loggedIn.success == false) return console.log("Invalid credentials")

    let userData = await api.getUserInfo()
    console.log(`logged in as ${userData.username}`)
}



//login using a json web token and store the session in the API object
async function authMethod2() {
    const token = "[jwt here]"
    const api = new API({ access_token: token })

    let userData = await api.getUserInfo()

    if (userData.request.status_code == 401) return console.log("Invalid token")
    console.log(`logged in as ${userData.username}`)

}


//login using a json web token and disregard the session each request
async function authMethod3() {
    const api = new API()

    const token = "[jwt here]"
    let userData = await api.getUserInfo({ access_token: token })

    if (userData.request.status_code == 401) return console.log("Invalid token")
    console.log(`logged in as ${userData.username}`)

}
