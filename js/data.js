const IMG={
  waffle:"https://d8j0ntlcm91z4.cloudfront.net/user_3F2zO4mnH1Ac9Z8aX9b4j07BQzs/hf_20260828_113143_86a64521-ab07-4db5-8b4c-a6b162262c35.png", waffle2:"https://d8j0ntlcm91z4.cloudfront.net/user_3F2zO4mnH1Ac9Z8aX9b4j07BQzs/hf_20260828_113143_ee9154ae-000b-4bad-b367-8b568f862725.png", dough:"https://d8j0ntlcm91z4.cloudfront.net/user_3F2zO4mnH1Ac9Z8aX9b4j07BQzs/hf_20260828_113143_48b8558e-0081-4f8f-beae-56f05d315b65.png", shake:"https://d8j0ntlcm91z4.cloudfront.net/user_3F2zO4mnH1Ac9Z8aX9b4j07BQzs/hf_20260828_113143_d5d2c3f9-0233-4565-ab5e-ebe67d831c70.png",
  cake:"https://d8j0ntlcm91z4.cloudfront.net/user_3F2zO4mnH1Ac9Z8aX9b4j07BQzs/hf_20260828_113143_f4b6d73f-efb8-4cb7-8080-3bce4bd41dad.png", crepe:"https://d8j0ntlcm91z4.cloudfront.net/user_3F2zO4mnH1Ac9Z8aX9b4j07BQzs/hf_20260828_113143_888b2429-eb79-4229-b3bf-d49e663fe8c4.png", pancake:"https://d8j0ntlcm91z4.cloudfront.net/user_3F2zO4mnH1Ac9Z8aX9b4j07BQzs/hf_20260828_113143_888b2429-eb79-4229-b3bf-d49e663fe8c4.png", tart:"https://d8j0ntlcm91z4.cloudfront.net/user_3F2zO4mnH1Ac9Z8aX9b4j07BQzs/hf_20260828_113143_87d8a66d-1ae3-45ae-9b66-bb48e48a8a81.png",
  kids:"https://d8j0ntlcm91z4.cloudfront.net/user_3F2zO4mnH1Ac9Z8aX9b4j07BQzs/hf_20260828_113143_7a6126b2-6376-43f4-8cfe-52b4037ec953.png", couples:"https://d8j0ntlcm91z4.cloudfront.net/user_3F2zO4mnH1Ac9Z8aX9b4j07BQzs/hf_20260828_113143_dfe4f1b5-387e-480c-a3b7-b355263b29ce.png", blast:"https://d8j0ntlcm91z4.cloudfront.net/user_3F2zO4mnH1Ac9Z8aX9b4j07BQzs/hf_20260828_113143_8f195c5c-3622-4d57-970d-bd3d74128e98.png", sweets:"https://d8j0ntlcm91z4.cloudfront.net/user_3F2zO4mnH1Ac9Z8aX9b4j07BQzs/hf_20260828_113143_382c7268-ec52-4c47-a831-0f0bbbe6b6e3.png"
};
const TOPPINGS=["Kinder Bueno","Lotus Biscoff","Oreo","Maltesers","Smarties","Strawberries",
  "Banana","Marshmallows","Sprinkles","White Chocolate","Milk Chocolate"];
const SHAKES=["Oreo","Kinder Bueno","Biscoff","Strawberry","Banana","Aero Mint","Malteser"];
const BLASTS=["Blue raspberry","Cherry","Strawberry","Cola"];

const DEALS=[
 {id:"d1",name:"Any 2 waffles",img:IMG.waffle2,price:15.99,desc:"Two waffles with one topping each",
  groups:[{label:"Waffle 1 topping",req:1,opts:TOPPINGS},{label:"Waffle 2 topping",req:1,opts:TOPPINGS}]},
 {id:"d2",name:"Any 2 cookie dough",img:IMG.dough,price:15.99,desc:"White or milk chocolate",
  groups:[{label:"Dough 1",req:1,opts:["White chocolate","Milk chocolate"]},{label:"Dough 2",req:1,opts:["White chocolate","Milk chocolate"]}]},
 {id:"d3",name:"Any 2 crepes",img:IMG.crepe,price:15.99,desc:"Choose a flavour for each",
  groups:[{label:"Crepe 1",req:1,opts:TOPPINGS},{label:"Crepe 2",req:1,opts:TOPPINGS}]},
 {id:"d4",name:"2 reg milkshakes with cream",img:IMG.shake,price:12.99,desc:"Pick both flavours",
  groups:[{label:"Shake 1",req:1,opts:SHAKES},{label:"Shake 2",req:1,opts:SHAKES}]},
 {id:"d5",name:"Waffle + regular milkshake",img:IMG.waffle,price:13.99,desc:"One of each",
  groups:[{label:"Waffle topping",req:1,opts:TOPPINGS},{label:"Milkshake flavour",req:1,opts:SHAKES}]},
 {id:"d6",name:"Cake + reg ice blast",img:IMG.blast,price:7.99,desc:"Any slice of cake and a regular ice blast",
  groups:[{label:"Ice blast flavour",req:1,opts:BLASTS}]}
];

const MENU=[
 {id:"m1",cat:"Waffles",name:"Waffle",img:IMG.waffle,price:8.49,desc:"Freshly made with your choice of toppings",
  groups:[{label:"Choose your topping",req:1,opts:TOPPINGS},{label:"Extra toppings",req:0,opts:TOPPINGS,add:.8}]},
 {id:"m2",cat:"Waffles",name:"Half waffle",img:IMG.waffle,price:5.49,desc:"Smaller portion, one topping",
  groups:[{label:"Choose your topping",req:1,opts:TOPPINGS}]},
 {id:"m3",cat:"Cookie dough",name:"Cookie dough",img:IMG.dough,price:8.49,desc:"Baked to order",
  groups:[{label:"Base",req:1,opts:["White chocolate","Milk chocolate"]},{label:"Add a topping",req:0,opts:TOPPINGS,add:.8}]},
 {id:"m4",cat:"Milkshakes",name:"Regular milkshake",img:IMG.shake,price:5.49,desc:"12oz, choose your flavour",
  groups:[{label:"Flavour",req:1,opts:SHAKES},{label:"Add cream",req:0,opts:["Whipped cream"],add:.5}]},
 {id:"m5",cat:"Milkshakes",name:"Large milkshake",img:IMG.shake,price:6.49,desc:"21oz",
  groups:[{label:"Flavour",req:1,opts:SHAKES}]},
 {id:"m6",cat:"Cakes",name:"Old school sprinkle cake",img:IMG.cake,price:3.99,desc:"Slice"},
 {id:"m7",cat:"Cakes",name:"Cornflake tart",img:IMG.tart,price:3.99,desc:"Slice"},
 {id:"m8",cat:"Crepes",name:"Crepe",img:IMG.crepe,price:7.99,desc:"Choose a filling",
  groups:[{label:"Filling",req:1,opts:TOPPINGS}]},
 {id:"m9",cat:"Crepes",name:"Pancake stack",img:IMG.pancake,price:7.99,desc:"Choose a topping",
  groups:[{label:"Topping",req:1,opts:TOPPINGS}]},
 {id:"m10",cat:"Boxes",name:"Kids' box",img:IMG.kids,price:5.99,desc:"12oz milkshake, cake pot or brownie mini mix up & space raiders",
  groups:[{label:"Milkshake flavour",req:1,opts:SHAKES}]},
 {id:"m11",cat:"Boxes",name:"Home Alone adult box",img:IMG.kids,price:9.99,desc:"16oz milkshake, standard mix up, cornflake tart or brownie & space raiders",
  groups:[{label:"Milkshake flavour",req:1,opts:SHAKES}]},
 {id:"m12",cat:"Boxes",name:"Couples' retreat",img:IMG.couples,price:20.99,desc:"2 cake slices, 2 space raiders, giant mix up, 2 regular ice blasts",
  groups:[{label:"Ice blast flavour",req:1,opts:BLASTS}]},
 {id:"m13",cat:"Drinks",name:"Regular ice blast",img:IMG.blast,price:2.95,desc:"Choose a flavour",
  groups:[{label:"Flavour",req:1,opts:BLASTS}]},
 {id:"m14",cat:"Sweets",name:"Pick & mix (100g)",img:IMG.sweets,price:1.30,desc:"Traditional sweets, weighed out"}
];
/* Supabase config — anon key is public by design; RLS enforces access. */
const SB_URL  = "https://coiwwbroycaznkmhevde.supabase.co";
const SB_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvaXd3YnJveWNhem5rbWhldmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NzIwMjksImV4cCI6MjA5OTU0ODAyOX0.r-k8RjKqouqjekvEXSMKzJykKbtgpGLMZQXcXhAmRW8";
const CLIENT_REF = "sweetmunchies";
const APP_VERSION = "0.3.0";
