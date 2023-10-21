import { useState, useEffect, useRef } from "react";
import NavMenu from "../../Menu/NavMenu";
import ReCAPTCHA from "react-google-recaptcha";
import { auth, db } from '../../FirebaseConfig';
import { onAuthStateChanged, sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Checkbox, Button, Modal, notification, } from 'antd';
import "../../special styles/ant_col_style.css"
import { doc, getDoc, collection, getDocs, updateDoc, deleteDoc,listCollections,writeBatch,deleteField,addDoc } from 'firebase/firestore';
import format from 'date-fns/format';
import * as Sentry from "@sentry/react";

import { MailOutlined, CommentOutlined, CustomerServiceOutlined, LogoutOutlined } from '@ant-design/icons'; // Ant Design ikonları
import { signOut } from "firebase/auth";
const Profile = ({usernamesurname, setusernamesurname}) => {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [accountType, setaccountType] = useState("");
  const [emailVerified, setemailVerified] = useState("");
  const [userType, setuserType] = useState("");
  const [accountCreationDate, setaccountCreationDate] = useState("");

  const formRef = useRef(null);
  const navigate = useNavigate();
  let userInfo;

  const [updateLoading, setUpdateLoading] = useState(false);
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  const [feedbackDescription, setFeedbackDescription] = useState("");
  const [isFeedbackCaptchaVerified2, setFeedbackCaptchaVerified2] = useState(false);
  const feedbackcaptcharef = useRef(null);
  const [feedbackform] = Form.useForm();
  const [feedbackbuttonloading, setfeedbackbuttonloading] = useState(false);
  const [isFeedbackModalVisible, setFeedbackModalVisible] = useState(false);


  const handleDeleteAccount = () => {
    setIsDeleteModalVisible(true);
  }


  const handleFeedbackSubmit = async () => {
    setfeedbackbuttonloading(true);
    
    if (!isFeedbackCaptchaVerified2) {
      notification.error({
        message: 'Doğrulama Hatası',
        description: 'Lütfen reCAPTCHA doğrulamasını tamamlayın.',
        placement: 'topLeft',
      });

      setfeedbackbuttonloading(false);
      return;
    }

    try {
      const feedbacksCollectionRef = collection(db, "feedbacks");

      const formattedDate = format(new Date(), 'dd-MM-yyyy');

      await addDoc(feedbacksCollectionRef, {
        feedback: feedbackDescription,
        senderEmail: email,
        timestamp: formattedDate
      });

      notification.success({
        message: 'Başarılı',
        description: 'Geri bildiriminiz başarıyla gönderildi!',
        placement: 'topRight',
      });
      setFeedbackModalVisible(false);
    } catch (error) {
      console.error("Error writing document: ", error);
      notification.error({
        message: 'Hata',
        description: 'Bir hata oluştu, lütfen tekrar deneyin.',
        placement: 'topLeft',
      });
      Sentry.captureException(error);

    }

    feedbackcaptcharef.current.reset();
    setfeedbackbuttonloading(false);
    setFeedbackCaptchaVerified2(false);
    setFeedbackDescription(null);
    feedbackform.resetFields();
    setFeedbackModalVisible(false);

  }


  const deleteUserDetails = async (email) => {
    // Kullanıcı belgesini e-posta adresine göre alın
    const userDocRef = doc(db, "users", email);
    
    // userInfo alt koleksiyonundaki belgeleri silin
    const userInfoCollection = collection(userDocRef, 'userInfo');
    const userInfoDocs = await getDocs(userInfoCollection);
    userInfoDocs.forEach(async (doc) => {
        await deleteDoc(doc.ref);
    });

    // tasks alt koleksiyonundaki belgeleri silin
    const tasksCollection = collection(userDocRef, 'tasks');
    const tasksDocs = await getDocs(tasksCollection);
    tasksDocs.forEach(async (doc) => {
        await deleteDoc(doc.ref);
    });

    // notifications alt koleksiyonundaki belgeleri silin
    const notificationsCollection = collection(userDocRef, 'notifications');
    const notificationsDocs = await getDocs(notificationsCollection);
    notificationsDocs.forEach(async (doc) => {
        await deleteDoc(doc.ref);
    });
    
    // Eğer kullanıcının ana belgesini de silmek istiyorsanız, aşağıdaki satırı ekleyin:
    await deleteDoc(userDocRef);
};

// Fonksiyonu çağırarak belirli bir e-posta adresine sahip kullanıcının detaylarını silin



 

  
  

  






  const confirmDelete = async () => {
    setDeleteAccountLoading(true);
  
      await deleteUserDetails(email);
      

      if (user) {
        deleteUser(user).then(() => {
          notification.success({
            message: 'Başarılı!',
            description: 'Hesabınız başarıyla silindi.'
          });
        }).catch((error) => {
          notification.error({
            message: 'Hata!',
            description: `Bir sorun oluştu: ${error.message}`
            
          });
          Sentry.captureException(error);
        });
      }


   
      setIsDeleteModalVisible(false);
      setDeleteAccountLoading(false);
    
  }

  const getUserAccountInfo = async (userEmail) => {
    // Kullanıcı belgesine eriş
    const userDocRef = doc(db, "users", userEmail);

    // userInfo koleksiyonuna eriş
    const userInfoCollectionRef = collection(userDocRef, "userInfo");

    // userInfo koleksiyonundaki belgeleri al
    const userInfoSnapshot = await getDocs(userInfoCollectionRef);



    userInfoSnapshot.forEach(doc => {
      // Eğer belge içerisinde userAccountInfo alanı varsa al
      if (doc.exists() && doc.data().hasOwnProperty("userAccountInfo")) {
        userInfo = doc.data();
      }
    });


    setName(userInfo.userProfileInfo.name);
    setSurname(userInfo.userProfileInfo.surname);
    setEmail(userInfo.userProfileInfo.email);
    setPhone(userInfo.userProfileInfo.phoneNumber);
    setaccountType(userInfo.userAccountInfo.accountType);
    setuserType(userInfo.userAccountInfo.userType);
    setaccountCreationDate(userInfo.userAccountInfo.accountCreationDate);
  }

  const handlePasswordReset = async (email) => {

    setChangePassLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      notification.success({
        message: 'Başarılı',
        description: `Şifre yenileme bağlantısı ${email} adresine gönderildi. Şifre yenileme bağlantılarını içeren postalar kullanım sıklığına bağlı olarak spam-gereksiz kutularına düşebilir. Gelen kutusunda bu postaları göremezseniz ilk olarak spam-gereksiz kutularını kontrol etmelisiniz.`,
        placement: 'topRight',
      });

    } catch (error) {
      notification.error({
        message: 'Hata',
        description: error.message,
        placement: 'topLeft',
      });
      Sentry.captureException(error);
    } finally {
      setChangePassLoading(false);
    }
  };
  const updateUserAccountInfo = async (userEmail) => {
    setUpdateLoading(true);
    try {
      // Formun tüm değerlerini validate eder.
      const values = await formRef.current.validateFields();

      try {
        // Kullanıcı belgesine eriş
        const userDocRef = doc(db, "users", userEmail);

        // userInfo koleksiyonuna eriş
        const userInfoCollectionRef = collection(userDocRef, "userInfo");

        // userInfo koleksiyonundaki belgeleri al
        const userInfoSnapshot = await getDocs(userInfoCollectionRef);

        let updateTasks = [];

        userInfoSnapshot.forEach(doc => {
          // Eğer belge içerisinde userAccountInfo alanı varsa belgeyi güncelle
          if (doc.exists() && doc.data().hasOwnProperty("userAccountInfo")) {
            
            const userDocToUpdate = doc.ref;
            const updateTask = updateDoc(userDocToUpdate, {
              "userProfileInfo.name": name,
              "userProfileInfo.surname": surname,
              "userProfileInfo.phoneNumber": phone,
            });

            updateTasks.push(updateTask);
          }
        });

        await Promise.all(updateTasks);

        if (updateTasks.length > 0) {
          notification.success({
            message: 'Başarılı!',
            description: 'Bilgileriniz başarıyla güncellendi.'

          });
          setusernamesurname(name+" "+surname);
          setUpdateLoading(false);
        } else {
          throw new Error("Belge bulunamadı veya güncellenemedi.");
          setUpdateLoading(false);
        }

      } catch (error) {
        notification.error({
          message: 'Hata!',
          description: `Bir sorun oluştu: ${error.message}`
        });
        Sentry.captureException(error);
        setUpdateLoading(false);

      }



    } catch (error) {
      // Doğrulama hatası varsa bu bloğa girer.
      console.error("Doğrulama hatası:", error);
      
      setUpdateLoading(false);
      Sentry.captureException(error);
      // Eğer bir hatayla karşılaşırsanız burada kullanıcıya bilgi vermek
      // için bir uyarı veya hata mesajı gösterebilirsiniz.
    }
  };






  const logoutUser = async () => {
    try {
      await signOut(auth);

    } catch (error) {

    }
  };

  const [currentpage, setcurrentpage] = useState();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (!user.emailVerified) {
          navigate('/', { replace: true });

        }
        setcurrentpage("2");
        const useremail = user.email;
        getUserAccountInfo(useremail);




      }

      else {
        // E-posta doğrulandıysa ana sayfaya yönlendir
        navigate('/', { replace: true });
      }
    });

    return () => unsubscribe();
  }, []);


  const handleCaptchaChange = () => {
    setFeedbackCaptchaVerified2(true);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-row font-inter text-[18px] font-light">
      <NavMenu usernamesurname={usernamesurname} setFeedbackModalVisible={setFeedbackModalVisible}  currentpage={currentpage} />
      <Modal
        centered={true}
        title={<div className='text-center font-inter font-normal text-[20px]'>Geri Bildirim</div>}
        open={isFeedbackModalVisible}
        onCancel={() => { setFeedbackModalVisible(false); feedbackcaptcharef.current.reset(); setFeedbackDescription(null); feedbackform.resetFields(); }}
        footer={null}

      >


        <Form form={feedbackform} className='w-full px-5 flex flex-col gap-5 justify-center items-center' onFinish={handleFeedbackSubmit}>
          <p className='text-center'>Geri bildirim göndererek uygulamayı geliştirmemize yardımcı olabilirsiniz</p>
          <Form.Item
            className='mb-0 w-full'
            name="feedbackDescription"
            rules={[
              { required: true, message: "Bu alan zorunludur." },
              { max: 300, message: "Maksimum 300 karakter olmalıdır." },
              { pattern: /^(?!\s*$).+/, message: "Sadece boşluk olamaz." }
            ]}
          >
            <Input.TextArea
              placeholder="Geri bildiriminiz..."
              onChange={e => setFeedbackDescription(e.target.value)}

            />
          </Form.Item>

          <ReCAPTCHA
            ref={feedbackcaptcharef}
            sitekey="6LdaOYonAAAAAEOSD7wWnV6Tsi9wjj7QSs4SBjd5"
            onChange={() => { handleCaptchaChange(); }}


          />

          <Form.Item className='mb-0 w-full'>
            <Button type="primary" loading={feedbackbuttonloading} className='w-full border-none text-white hover:text-white bg-[#2E7EFF] hover:bg-[#2E7EFF] font-inter text-[16px]' htmlType="submit">Gönder</Button>
          </Form.Item>
        </Form>
      </Modal>
      <div style={{ WebkitOverflowScrolling: 'touch', overflow: 'auto' }}  className=" h-screen w-full bg-white  lg:w-[calc(100%_-_300px)] fixed right-0 flex flex-col items-center justify-center justify-between  py-10" >
        <div className="w-[90%]  h-[50px] flex flex-row justify-end">
          <svg className="cursor-pointer" xmlns="http://www.w3.org/2000/svg" onClick={logoutUser} width="30" viewBox="0 0 23 22.511">
            <g id="log-out" transform="translate(278.5 18.011)">
              <g id="log-out-2" data-name="log-out" transform="translate(-278 -17.511)">
                <path id="Path_3017" data-name="Path 3017" d="M10.17,24.511H5.39A2.39,2.39,0,0,1,3,22.121V5.39A2.39,2.39,0,0,1,5.39,3h4.78" transform="translate(-3 -3)" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
                <path id="Path_3018" data-name="Path 3018" d="M16,18.951l5.975-5.975L16,7" transform="translate(-0.464 -2.22)" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
                <line id="Line_15" data-name="Line 15" x1="15" transform="translate(7 10.511)" fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
              </g>
            </g>
          </svg>

        </div>
        <div className="flex flex-col justify-center items-center  w-[70%] gap-[50px]">
          <div className="flex flex-col justify-center items-center gap-3">

            <div className="text-[35px] font-inter font-normal">Profil Bilgileri</div>
          </div>

          <Form ref={formRef} fields={[{ name: ["name"], value: name, }, { name: ["surname"], value: surname, }, { name: ["email"], value: email, }, { name: ["phone"], value: phone, }]} className=" profile-form w-3/4 lg:w-full flex flex-col lg:flex-row gap-0 lg:gap-8 ">


            <Form.Item
              className="name-label"
              label={<label htmlFor='name-input' className='font-inter text-[17px] font-normal'>Ad</label>}
              name="name"
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
              rules={[
                { required: true, message: 'Lütfen adınızı girin!' },
                { max: 50, message: 'Ad en fazla 50 karakter olmalıdır!' },
                { pattern: /[^\s]/, message: 'Sadece boşluk karakteri kullanılamaz!' },
                { pattern: /^[^<>]*$/, message: 'HTML etiketleri kullanılamaz!' }
              ]}
            >
              <Input id='name-input' className='font-inter text-[17px] shadow-sm border text-center' onChange={(e) => setName(e.target.value.trim().split(/\s+/).join(' '))} />
            </Form.Item>
            <Form.Item
              className="surname-label"
              label={<label htmlFor='surname-input' className=' font-inter text-[17px] font-normal'>Soyad</label>}
              name="surname"
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
              rules={[
                { required: true, message: 'Lütfen soyadınızı girin!' },
                { max: 50, message: 'Soyad en fazla 50 karakter olmalıdır!' },
                { pattern: /[^\s]/, message: 'Sadece boşluk karakteri kullanılamaz!' },
                { pattern: /^[^<>]*$/, message: 'HTML etiketleri kullanılamaz!' }
              ]}
            >
              <Input id='surname-input' className='font-inter text-[17px] shadow-sm border text-center' onChange={(e) => setSurname(e.target.value.trim().split(/\s+/).join(' '))} />
            </Form.Item>



            <Form.Item
              className="email"
              label={<label htmlFor='email-input' className=' font-inter text-[17px] font-normal '>E-mail</label>}
              name="email"
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
              rules={[
                { type: 'email', message: 'Geçerli bir e-posta girin!' },
                { required: true, message: 'Lütfen e-postanızı girin!' },
                { max: 100, message: 'E-posta en fazla 100 karakter olmalıdır!' }
              ]}
            >
              <Input id='email-input' disabled={true} type='email' className='font-inter text-[17px] shadow-sm border text-center' onChange={(e) => setEmail(e.target.value.trim())} />
            </Form.Item>
            <Form.Item

              className="phone"
              label={
                <label htmlFor='phone-input' className=' font-inter text-[17px] font-normal ' >Telefon</label>
              }
              name="phone"
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
              rules={[
                { required: false, message: 'Lütfen parolanızı girin!' },
                { min: 10, message: 'Telefon Numaranız en az 10 karakter olmalıdır!' },
                { max: 15, message: 'en fazla 15 haneli değer girebilirsiniz!' },
                { pattern: /[^\s]/, message: 'Sadece boşluk karakteri kullanılamaz!' },
                { pattern: /^[^<>]*$/, message: 'HTML etiketleri kullanılamaz!' },
                { pattern: /^\d+$/, message: 'Sadece sayısal değerler girebilirsiniz!' }
              ]}
            >
              <Input type="tel" id='phone-input' className='font-inter text-[17px] shadow-sm border text-center' onChange={(e) => setPhone(e.target.value.trim())} />
            </Form.Item>
          </Form>

          <div className="flex flex-col  items-center lg:flex-row w-full shadow-sm rounded-lg border py-2">
            <div className="flex flex-col justify-center  items-center py-3 w-full gap-2">
              <p className="text-center w-[90%] font-normal">Hesap Türü</p>
              <p className="text-center text-[#65DA9B]">{accountType}</p>
            </div>

            <div className="flex flex-col justify-center  items-center py-3 w-full gap-2">
              <p className="text-center w-[90%] font-normal">Hesap Yetkisi</p>
              <p className="text-center">{userType}</p>
            </div>
            <div className="flex flex-col justify-center  items-center py-3 w-full gap-2">
              <p className="text-center w-[90%] font-normal">Oluşturulma Tarihi</p>
              <p className="text-center">{accountCreationDate}</p>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row md:flex-row gap-3 ">
            <Button className="bg-[#FFA701] text-white border-none rounded-lg w-[150px]" loading={updateLoading} onClick={() => updateUserAccountInfo(email)}>Bilgileri Güncelle</Button>
            <Button className="bg-[#65DA9B] text-white border-none rounded-lg w-[150px]" onClick={() => handlePasswordReset(email)} loading={changePassLoading}>Şifreyi Değiştir</Button>
            <Button className="bg-[#FF4D4C] text-white border-none rounded-lg w-[150px]" onClick={handleDeleteAccount} loading={deleteAccountLoading}>Hesabı Sil</Button>
          </div>
          <div className="flex flex-col lg:flex-row md:flex-row gap-2 lg:gap-0 items-center justify-center w-[40%] h-fit py-3 lg:py-0 lg:h-[75px] shadow-sm rounded-lg border">
            
            <div onClick={()=>{ window.location.href = "mailto:support@todo.bugasoft.com";}} className="flex flex-col h-[50px] justify-center items-center w-full">
              <p className="text-center cursor-pointer flex flex-col gap-1 items-center justify-center" >
                <MailOutlined />
                Destek 
              </p>
            </div>
          </div>
        </div>
        <div className="w-full h-[10px]"></div>
        <Modal
          title="Hesap Silme Onayı"
          open={isDeleteModalVisible}
          onCancel={() => setIsDeleteModalVisible(false)}
          centered={true}
          footer={[
            <Button key="back" onClick={() => setIsDeleteModalVisible(false)} style={{ backgroundColor: "#FF4D4C", color: "white" }}>
              Hayır
            </Button>,
            <Button key="submit" type="primary" onClick={confirmDelete} style={{ backgroundColor: "#65DA9B", color: "white" }}>
              Evet
            </Button>,
          ]}
        >
          Bugasoft Todo Hesabınız ve kayıtlı tüm verileriniz silinecektir. Emin misiniz?
        </Modal>
      </div>

    </div>
  );
};

export default Profile;
