import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Checkbox, Button, Modal, notification } from 'antd';
import { createUserWithEmailAndPassword, sendEmailVerification, onAuthStateChanged } from 'firebase/auth';
import { auth,db } from '../../FirebaseConfig';
import ReCAPTCHA from "react-google-recaptcha";
import { doc, setDoc } from "firebase/firestore"; 
import { collection, addDoc } from "firebase/firestore"; 
import * as Sentry from "@sentry/react";

const Register = ({setusernamesurname}) => {
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [kvkk, setKvkk] = useState(true);
    const [digitalPermission, setDigitalPermission] = useState(false);
    const [accountType, setaccountType] = useState("Basic");
    
    const [userType, setuserType] = useState("Kullanıcı");
    const [accountCreationDate, setaccountCreationDate] = useState(new Date().toISOString().split('T')[0]);

    const [accountStatus, setaccountStatus] = useState("Aktif");
    const [loginDates, setloginDates] = useState([]);
    const [phoneNumber, setphoneNumber] = useState("");

    const [recaptchaValue, setRecaptchaValue] = useState(null);
    const [isDigitalPermission, setisDigitalPermission] = useState(false);
    const [isKvkkOpen, setisKvkkOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [userUID, setuserUID] = useState("");
    const navigate = useNavigate();

    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
      }
      

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setuserUID(user.uid);
                navigate('/', { replace: true });
            }
        });

        return () => unsubscribe();
    }, []);
    const handleCaptchaChange = value => {
        setRecaptchaValue(value);  // reCAPTCHA'dan gelen değeri kaydedin.
    };
    const kvkkOpen = (e) => {
        e.preventDefault();
        setisKvkkOpen(true);
    };

    const kvkkClose = () => {
        setisKvkkOpen(false);
    };

    const digitalpermissionopen = (e) => {
        e.preventDefault();
        setisDigitalPermission(true);
    };

    const digitalpermissionclose = () => {
        setisDigitalPermission(false);
    };

    const onFinish = async (value) => {
        if (!recaptchaValue) {
            notification.error({
                message: 'Doğrulama Hatası',
                description: 'Lütfen reCAPTCHA doğrulamasını tamamlayın.',
                placement: 'topLeft',
            });
            return;  // Eğer reCAPTCHA tamamlanmadıysa form gönderimini durdurun.
        }
        setLoading(true);
        try {
            

            await registerUser(email, password);
            await setUserDetails();
            
            notification.success({
                message: 'Kayıt Başarılı',
                description: 'Lütfen email adresinizi doğrulayın.',
                placement: 'topRight',
            });
        } catch (error) {
            console.log(error.message);

           

          
        }
        setLoading(false);
    };


    const registerUser = async (userEmail, userPassword) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, userEmail, userPassword);
            if (userCredential.user) {
                await sendEmailVerification(userCredential.user);


            }
        } catch (error) {
            throw error;
            Sentry.captureException(error);
        }
    };


    const setUserDetails = async () => {
        // Kullanıcı belgesini e-posta adresine göre oluşturun
        const userDocRef = doc(db, "users", email);
        const notificationsCollection = collection(db, 'notifications');
        // userInfo alt koleksiyonuna bir belge ekleyin
        const userInfoCollection = collection(userDocRef, 'userInfo');
        await addDoc(userInfoCollection, {
            userProfileInfo: userProfileInfo,
            userAccountInfo: userAccountInfo
        });
        
        // İlk görevi ekleyin
        const tasksCollection = collection(userDocRef, 'tasks');
        
        await addDoc(tasksCollection, { taskData: "ilk görev" });

        // İlk bildirimi ekleyin (eğer ihtiyaç varsa)
        const notificationsCollectioninline = collection(userDocRef, 'notifications');
        await addDoc(notificationsCollectioninline, { notificationData: "İlk bildirim" });
        

        await addDoc(notificationsCollection, {bildirim:"genel bildirim"});
        setusernamesurname(name+" "+surname);

    };
    

    
    const userProfileInfo = {
    name: name,
    surname: surname,
    email: email,
    
    phoneNumber: phoneNumber,  
};

const userAccountInfo = {
    
    kvkk: kvkk,
    digitalPermission: digitalPermission,
    accountType: accountType,
    
    userType: userType,
    accountCreationDate: accountCreationDate,
    accountStatus: accountStatus,
    loginDates: loginDates,
    
};

    
    
    





    return (
        <div className='w-screen h-screen'>
            <div className=" w-full h-full flex flex-row">
                <div className="register-section lg:w-[40%]  w-full h-full  flex flex-col justify-center items-center px-11 ">
                    <div className="register-content h-[70%] w-[80%] md:w-[50%] lg:w-[90%] flex flex-col gap-7 flex flex-col justify-center">
                        <div className="logo-zone  w-full flex flex-col justify-start">
                            <img className='h-[60px] w-[143px]' src="https://i.hizliresim.com/eaxzml9.png" alt="" />
                        </div>
                        <h1 className="register-title font-medium text-[24px]">Kayıt Ol</h1>
                        <Form onFinish={onFinish} className="space-y-2">

                            <div className="name-surname flex flex-row w-full justify-between gap-4">
                            <Form.Item
    className="name-label-reg mb-0"
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
    <Input id='name-input' className='font-inter text-[17px]' onChange={(e) => setName(capitalizeFirstLetter(e.target.value.trim().split(/\s+/).join(' ')))} />
</Form.Item>

                                <Form.Item
                                    className="surname-label-reg mb-0"
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
                                    <Input id='surname-input' className='font-inter text-[17px]' onChange={(e) => setSurname(capitalizeFirstLetter(e.target.value.trim().split(/\s+/).join(' ')))} />
                                </Form.Item>
                            </div>


                            <Form.Item
                                className="email-reg"
                                label={<label htmlFor='email-input' className=' font-inter text-[17px] font-normal'>E-mail</label>}
                                name="email"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                rules={[
                                    { type: 'email', message: 'Geçerli bir e-posta girin!' },
                                    { required: true, message: 'Lütfen e-postanızı girin!' },
                                    { max: 100, message: 'E-posta en fazla 100 karakter olmalıdır!' },
                                    { pattern: /[^\s]/, message: 'Sadece boşluk karakteri kullanılamaz!' },
                                    { pattern: /^[^<>]*$/, message: 'HTML etiketleri kullanılamaz!' }
                                ]}
                            >
                                <Input id='email-input' type='email' className='font-inter text-[17px]' onChange={(e) => setEmail(e.target.value.trim())} />
                            </Form.Item>
                            <Form.Item

                                className="password-reg"
                                label={
                                    <label htmlFor='password-input' className=' font-inter text-[17px] font-normal ' >Parola</label>
                                }
                                name="password"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                rules={[
                                    { required: true, message: 'Lütfen parolanızı girin!' },
                                    { min: 6, message: 'Parola en az 6 karakter olmalıdır!' },
                                    { max: 128, message: 'Parola en fazla 128 karakter olmalıdır!' },
                                    { pattern: /[^\s]/, message: 'Sadece boşluk karakteri kullanılamaz!' }
                                ]}
                            >
                                <Input.Password id='password-input' className='font-inter text-[17px]' onChange={(e) => setPassword(e.target.value)} />
                            </Form.Item>

                            <Form.Item className="kvkk-permission " labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
                                <p className='font-inter text-[16px]'>Kayıt Ol butonuna tıklayarak <a className=' text-[#65DA9B]' onClick={kvkkOpen} >KVKK Metnini </a> onaylamış olursunuz.</p>

                            </Form.Item>
                            <Modal title="KVKK Metni" centered open={isKvkkOpen} onCancel={kvkkClose} footer={null} maskClosable={true}>
                                <p>Some contents...</p>
                                <p>Some contents...</p>
                                <p>Some contents...</p>
                            </Modal>
                            <Form.Item
                                className="digital-permission"
                                name="digitalPermission"

                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                rules={[{ required: false, message: 'Lütfen dijital ileti iznini kabul edin!' }]}
                            >
                                <Checkbox className='font-inter text-[16px]' checked={digitalPermission} onChange={e => setDigitalPermission(e.target.checked)}>Dijital ileti<a className=' text-[#65DA9B]' onClick={digitalpermissionopen} > iznini </a>okudum, onaylıyorum.</Checkbox>
                            </Form.Item>
                            <Modal title="Dijital İleti İzni" centered open={isDigitalPermission} onCancel={digitalpermissionclose} footer={null} maskClosable={true}>
                                <p>Some contents...</p>
                                <p>Some contents...</p>
                                <p>Some contents...</p>
                            </Modal>
                            <ReCAPTCHA
                                sitekey="6LdaOYonAAAAAEOSD7wWnV6Tsi9wjj7QSs4SBjd5"
                                onChange={handleCaptchaChange}
                            />
                            <Form.Item className="register ">
                                <Button
                                    type='primary'
                                    htmlType='submit'
                                    className='w-full border-none text-white hover:text-white bg-[#2E7EFF] hover:bg-[#4D91FF] font-inter text-[16px]'
                                    disabled={loading} // Butonu devre dışı bırak
                                >
                                    {loading ? 'Kayıt olunuyor...' : 'Kayıt Ol'}
                                </Button>                            </Form.Item>
                        </Form>

                        <div className="login-label flex flex-col justify-center gap-2 items-center">
                            <label className=' text-center font-inter text-[16px]'>Zaten bir hesabın var mı?</label>
                            <a className='text-center w-fit text-[#5E62AA] font-inter text-[16px] cursor-pointer' onClick={() => navigate('/login', { replace: true })}>Giriş Yap</a>
                        </div>
                    </div>
                </div>
                <div className="banner-section lg:w-[60%]  w-0 h-full bg-[#797EDB] flex justify-center items-center">
                    <img className=' object-cover w-[80%] h-auto' src="https://i.hizliresim.com/ru1waq2.png" alt="" />
                </div>
            </div>
        </div>
    )
}

export default Register;
