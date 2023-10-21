import  { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from "firebase/app";
import Home from "./components/pages/Home"
import Register from "./components/pages/Register"
import Profile from "./components/pages/Profile"
import Login from "./components/pages/Login"
import { useNavigate } from 'react-router-dom'; // Bu satırı eklediğinizde 'react-router-dom' kütüphanesini de npm ile kurmanız gerekecek.

import {  db } from './FirebaseConfig';



import { doc, collection, getDocs } from 'firebase/firestore';






//
//
//
//
//
//
//
///////COMPONENT START
function App() {
  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  };
  //
  //
  //
  //
  //
  //
  //
  //
  //
  ///////STATES
  const navigate = useNavigate(); 
  const app = initializeApp(firebaseConfig);/// keep firebase app
  const auth = getAuth(app);/// keep authentication service
  const [loading, setLoading] = useState(true); /// keep loading page status 
  const [userInfo, setUserInfo] = useState(null);
  const [isFeedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [usernamesurname, setusernamesurname] = useState("");
let usernamesurnameinfo;
  //
  //
  //
  //
  //
  //
  //
  //
  //
  ///////FUNCTIONS
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        getUserAccountInfo(user.email);
        setUserInfo(true);
       
       
      } else {
        
        setUserInfo(false);
      }
      setLoading(false);  // Set loading to false after auth state has changed
    });

    return () => {
      unsubscribe();
    };
  }, []);



  const getUserAccountInfo = async (userEmail) => {
    // Kullanıcı belgesine eriş
    const userDocRef = doc(db, "users", userEmail);

    // userInfo koleksiyonuna eriş
    const userInfoCollectionRef = collection(userDocRef, "userInfo");

    // userInfo koleksiyonundaki belgeleri al
    const userInfoSnapshot = await getDocs(userInfoCollectionRef);

try {
  userInfoSnapshot.forEach(doc => {
    // Eğer belge içerisinde userAccountInfo alanı varsa al
    if (doc.exists() && doc.data().hasOwnProperty("userAccountInfo")) {
      usernamesurnameinfo = doc.data();
      setusernamesurname(usernamesurnameinfo.userProfileInfo.name+" "+usernamesurnameinfo.userProfileInfo.surname);
    }
  });
} catch (error) {
  
}

   


    
    
  }
  //
  //
  //
  //
  //
  //
  //
  //
  //
  ///////RENDER
  return (
    <div className='App w-screen h-screen'>
      {loading ? 
      (
        <div role="status">
          <svg aria-hidden="true" className="w-8 h-8 absolute left-[50%] top-[50%] text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
      ) : (
       
       

<Routes>
    <Route path="/register" element={userInfo ? <Home usernamesurname={usernamesurname} isFeedbackModalVisible={isFeedbackModalVisible} setFeedbackModalVisible={setFeedbackModalVisible} /> : <Register setusernamesurname={setusernamesurname} usernamesurname={usernamesurname}  />} />
    <Route path="/login" element={userInfo ? <Home usernamesurname={usernamesurname} isFeedbackModalVisible={isFeedbackModalVisible} setFeedbackModalVisible={setFeedbackModalVisible} />  : <Login />} />
    <Route path="/profile" element={userInfo ? <Profile setusernamesurname={setusernamesurname} usernamesurname={usernamesurname} isFeedbackModalVisible={isFeedbackModalVisible} setFeedbackModalVisible={setFeedbackModalVisible} /> : <Login />} />
    <Route path="/" element={userInfo ? <Home usernamesurname={usernamesurname} isFeedbackModalVisible={isFeedbackModalVisible} setFeedbackModalVisible={setFeedbackModalVisible} />  : <Login />} />
    <Route path="/home" element={userInfo ? <Home usernamesurname={usernamesurname} isFeedbackModalVisible={isFeedbackModalVisible} setFeedbackModalVisible={setFeedbackModalVisible} />  : <Login />} />
    <Route path="*" element={<div className='text-[50px] text-center h-full flex flex-col justify-center'>404 Sayfa Bulunamadı</div>} /> {/* Bu satır catch-all rotadır. */}
</Routes>


      )}
    </div>
  );
}

export default App;
