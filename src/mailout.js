const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

const serviceAccount = require("../path/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL
});

const db = admin.database();

const addresses = {}
let k = 0;

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS
    }
});

const sendEmails = (key) => {
    const refCelebreties = db.ref("celebreties/" + key);

    refCelebreties.once('value', (snapshotCelebrety) => {
        const data = snapshotCelebrety.val();
        const name = data.last_name?data.first_name + " " + data.last_name: data.first_name;

        data.followers?.forEach(item => {
            const refUser = db.ref("users/" + item);

            refUser.once('value', (snapshotUseUser) => {
                const user = snapshotUseUser.val();
                
                const mailOptions = {
                    from: process.env.EMAIL,
                    to: user.email,
                    subject: `${name} is now in a new location! Find out what's happening now!`,
                    text: `We have hot news! ${name} is now in a new place, and you can follow his/her adventures right now. This trip promises to be interesting and full of highlights, so don't miss a single detail.`
                }
                
                transporter.sendMail(mailOptions)
            });
        })
    });
}

const monitor = () => {
    const ref = db.ref("/celebreties");

    ref.on("value", (snapshot) => {
        const data = snapshot.val();
        let addressKey;
        
        for(let key in data){
            const item = data[key];

            for(let i = 0;i < item.addresses.length;i++){
                const address = item.addresses[i];

                if(k === 1 && address.isConfirm !== addresses[key][i].isConfirm && address.isConfirm){
                    addressKey = key;
                }
            }

            addresses[key] = item.addresses
        }

        if(addressKey){
            sendEmails(addressKey)
        }

        k = 1;
    });
}

module.exports = monitor