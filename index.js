const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000
const ObjectId = require('mongodb').ObjectId


app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.i8wrn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



     async  function run (){
        try{
            await client.connect()
            const database = client.db("doctors");
            const servicesCollection = database.collection("services");
            const bookingCollection = database.collection("booking");
            const userCollection = database.collection("user");
            const contactCollection = database.collection("contactus");

            // service 
            app.get('/service',async(req,res)=>{
                const service = servicesCollection.find({})
                const result = await service.toArray()
                res.send(result)
            })


            // booking 
            app.post('/booking',async(req,res)=>{
              const booking = req.body;
              const query = {tretmentName:booking.tretmentName,tretmentDate:booking.tretmentDate,patientName:booking.patientName}
              const exists = await bookingCollection.findOne(query)
                if(exists){
                  return res.send({success:false,booking:exists})
                }
              const result = await bookingCollection.insertOne(booking)
              res.json({success:true , result})
            })

            app.get('/booking',async(req,res)=>{ 
              const booking = bookingCollection.find({})
              const result = await booking.toArray()
              res.send(result)
            })

            app.delete('/booking/:id',async(req,res)=>{
              const id = req.params.id;
              const query = {_id:ObjectId(id)};
              const result = await bookingCollection.deleteOne(query)
              res.json(result)
            })

            // abalable appiontment 
            app.get('/abalable',async(req,res)=>{
              const date = req.query.date;
              const srvices = await servicesCollection.find().toArray()
              const query = {date:date};
              const bookings =  await bookingCollection.find(query).toArray()

                srvices.forEach(service =>{
                  const serviceBooking = bookings.filter(book => book.tretmentName === service.name)
                  const boockedSlots = serviceBooking.map(book => book.slot) 
                  const abalable = service.slots.filter(slot => !boockedSlots.includes(slot))
                  service.slots = abalable
                })

                res.send(srvices)

            })

            
            // user Message 
            app.post('/contactus',async(req,res)=>{
              const contact = req.body;
              const result = await contactCollection.insertOne(contact)
              res.json(result)
            })

            app.get('/contactus',async(req,res)=>{
                const contact = contactCollection.find({})
                const result = await contact.toArray()
                res.send(result) 
            })

            app.delete('/contactus/:id',async(req,res)=>{
              const id = req.params.id;
              const query = {_id:ObjectId(id)}
              const result = await contactCollection.deleteOne(query)
              res.json(result)
            })
          
          // admin role 
          app.put('/user/admin',async(req,res)=>{
            const user = req.body;
            const filter = {email:user.email};
            const updateDoc = {$set:{role:'admin'}};
            const result = await userCollection.updateOne(filter,updateDoc);
            console.log(result)
            res.json(result)
        })

        // admin 
        app.get('/user/:email',async(req,res)=>{
          const adminUser = req.params.email;
          const query = {email:adminUser};
          const user = await userCollection.findOne(query)
              let isAdmin = false;

                  if(user?.role === 'admin'){
                      isAdmin = true
                  }
              res.json({admin:isAdmin})
      })

        // upsert mongodb 
            app.put('/user/:email',async(req,res)=>{
              const email = req.params.email;
              const user = req.body;
              const filter = {email:email};
              const options = {upsert:true}
              const updateDoc = {$set:user};
              const result = await userCollection.updateOne(filter,updateDoc,options)
              res.send(result)
            })
            // user information 
            app.get('/user',async(req,res)=>{
              const user = userCollection.find({})
              const result = await user.toArray()
              res.send(result)
            })

        }
        finally{

        }
     }
    run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('doctors server is running')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})