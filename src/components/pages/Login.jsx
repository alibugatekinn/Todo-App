import { Input, Button, Form, notification, Modal, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useEffect, useState, useRef } from 'react';
import { auth } from '../../FirebaseConfig';
import ReCAPTCHA from "react-google-recaptcha";

const Login = () => {
    // --------- STATES BAŞLANGIÇ --------- //
    const captcha = useRef(null);
    const captcha2 = useRef(null);
    // Kullanıcı işlemleri sırasında yüklenme durumunu kontrol etmek için
    const [loading, setLoading] = useState(false);

    // reCAPTCHA değerini saklamak için
    const [recaptchaValue, setRecaptchaValue] = useState(null);
    const [recaptchaValue2, setRecaptchaValue2] = useState(null);

    // Şifremi unuttum modalını kontrol etmek için
    const [isForgotPasswordModalVisible, setIsForgotPasswordModalVisible] = useState(false);

    // Şifre yenileme form bilgilerini saklamak için (modal içerisinde kullanılır)
    const [forgotPasswordForm, setForgotPasswordForm] = useState(null);

    // --------- STATES BİTİŞ --------- //


    // React-Router-Dom'dan yönlendirme fonksiyonunu alıyoruz.
    const navigate = useNavigate();


    // --------- EVENT HANDLER FONKSİYONLARI BAŞLANGIÇ --------- //

    // reCAPTCHA değerinin değişikliklerini yakalamak için
    const handleCaptchaChange = value => {
        setRecaptchaValue(value);
    };
    const handleCaptchaChange2 = value => {
        setRecaptchaValue2(value);
    };
    // Şifremi unuttum modalını göstermek için
    const showForgotPasswordModal = () => {
        setIsForgotPasswordModalVisible(true);
    };

    // Şifremi unuttum modalını kapatmak için
    const handleForgotPasswordModalCancel = () => {
        setIsForgotPasswordModalVisible(false);
    };

    // Şifre yenileme talebini işlemek için
    const handlePasswordReset = async (email) => {
        if (!recaptchaValue2) {
            // Recaptcha tamamlanmadıysa bir hata mesajı göster
            notification.error({
                message: 'Recaptcha Hatası',
                description: 'Lütfen recaptcha doğrulamasını tamamlayın.',
                placement: 'topLeft',
            });
            return;
        }
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            notification.success({
                message: 'Başarılı',
                description: `Şifre yenileme bağlantısı ${email} adresine gönderildi.`,
                placement: 'topLeft',
            });
            setIsForgotPasswordModalVisible(false);
        } catch (error) {
            notification.error({
                message: 'Hata',
                description: error.message,
                placement: 'topLeft',
            });
        } finally {
            setLoading(false);
        }
    };

    // --------- EVENT HANDLER FONKSİYONLARI BİTİŞ --------- //


    // Kullanıcı giriş yapmışsa ana sayfaya yönlendirme
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                navigate('/', { replace: true });
            }
        });

        // Component unmount olduğunda Firebase listener'ı kapatıyoruz.
        return () => unsubscribe();
    }, []);


    // Form gönderildiğinde giriş işlemleri
    const onFinish = async (values) => {
        if (!recaptchaValue) {
            notification.error({
                message: 'Doğrulama Hatası',
                description: 'Lütfen reCAPTCHA doğrulamasını tamamlayın.',
                placement: 'topLeft',
            });
            return;
        }

        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, values.email, values.password);
            notification.success({
                message: 'Giriş Başarılı',
                description: 'Başarıyla giriş yaptınız!',
                placement: 'topRight',
            });
        } catch (error) {
            setRecaptchaValue(null);

            let errorMessage = error.message;
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Bu e-posta adresine sahip bir kullanıcı bulunamadı.';

                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Yanlış parola girdiniz. Lütfen tekrar deneyin.';

                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.';

                    break;
            }
            notification.error({
                message: 'Giriş Başarısız',
                description: errorMessage,
                placement: 'topLeft',
            });
            captcha.current.reset();

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='w-screen h-screen'>
            <div className="w-full h-full flex flex-row">
                <div className="login-section lg:w-[40%] w-full h-full flex flex-col justify-center items-center px-11 ">
                    <div className="login-content h-[70%] w-[80%] md:w-[50%] lg:w-[80%] flex flex-col gap-7 flex flex-col justify-center">
                        <div className="logo-zone w-full flex flex-col justify-start">
                            <img className='h-[60px] w-[143px]' src="https://i.hizliresim.com/eaxzml9.png" alt="" />
                        </div>
                        <h1 className="register-title font-medium text-[24px]">Giriş Yap</h1>
                        <Form onFinish={onFinish} className="space-y-1">
                            <Form.Item
                                className="email-log mb-0"
                                label={<label htmlFor='email-input' className=' font-inter text-[17px] font-normal ' >E-mail</label>}
                                name="email"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                rules={[
                                    { type: 'email', message: 'Geçerli bir e-posta girin!' },
                                    { required: true, message: 'Lütfen e-postanızı girin!' },
                                    { pattern: /[^\s]/, message: 'Sadece boşluk karakteri kullanılamaz!' },
                                    { pattern: /^[^<>]*$/, message: 'HTML etiketleri kullanılamaz!' }
                                ]}
                            >
                                <Input id='email-input' type='email' className='font-inter text-[17px]' />
                            </Form.Item>
                            <Form.Item
                                className="password-log"
                                label={<label htmlFor='password-input' className=' font-inter text-[17px] font-normal ' >Parola</label>}
                                name="password"
                                labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                rules={[{ required: true, message: 'Lütfen parolanızı girin!' },
                                { pattern: /[^\s]/, message: 'Sadece boşluk karakteri kullanılamaz!' },]}
                            >
                                <Input.Password id='password-input' className='font-inter text-[17px]' />
                            </Form.Item>
                            <Form.Item>
                                <div className="login-forgot-password-label flex flex-col items-end ">
                                    <a className='text-right text-[#5E62AA] font-inter text-[16px] w-fit' onClick={showForgotPasswordModal}>Şifremi Unuttum</a>
                                </div>
                            </Form.Item>
                            <Modal 
                                title="Şifre Yenileme"
                                open={isForgotPasswordModalVisible}
                                onOk={() => forgotPasswordForm.submit()}
                                onCancel={handleForgotPasswordModalCancel}
                                centered
                                maskClosable={true}
                                footer={[<div className='flex flex-col justify-center items-center'>
                                    <Button key="submit" type="" loading={loading} onClick={() => forgotPasswordForm.submit()} className='w-fit border-none text-white hover:text-white bg-[#2E7EFF] hover:bg-[#4D91FF] font-inter text-[16px]'>
                                        Şifre Yenileme Bağlantısı Al
                                    </Button>
                                </div>
                                    
                                ]}
                            >
                                
                                <p className='mb-4'>Lütfen kayıtlı E-posta adresinizi yazın. Şifre yenileme bağlantılarını içeren postalar kullanım sıklığına bağlı olarak spam-gereksiz kutularına düşebilir. Gelen kutusunda bu postaları göremezseniz ilk olarak spam-gereksiz kutularını kontrol etmelisiniz. </p>

                                <Form 
                                    name="forgot_password_form"
                                    onFinish={(values) => handlePasswordReset(values.forgotPasswordEmail)}
                                    ref={forgotPasswordForm => setForgotPasswordForm(forgotPasswordForm)}
                                >
                                    <Form.Item
                                        label={<label htmlFor='forgotpasswordemail-input'>E-mail</label>}
                                        name="forgotPasswordEmail"
                                        labelCol={{ span: 24 }}
                                wrapperCol={{ span: 24 }}
                                rules={[
                                    { type: 'email', message: 'Geçerli bir e-posta girin!' },
                                    { required: true, message: 'Lütfen e-postanızı girin!' },
                                    { max: 100, message: 'E-posta en fazla 100 karakter olmalıdır!' }
                                ]}
                                className="customFormItem"

                                    >
                                        <Input id='forgotpasswordemail-input' />
                                    </Form.Item>
                                    <Form.Item className='flex flex-col justify-center items-center'
                                        label=""
                                        name="forgotPasswordCaptcha"
                                        
                                    >
                                        <ReCAPTCHA
                                            ref={captcha2}
                                            sitekey="6LdaOYonAAAAAEOSD7wWnV6Tsi9wjj7QSs4SBjd5"
                                            onChange={handleCaptchaChange2}
                                        />
                                    </Form.Item>
                                </Form>
                            </Modal>

                            <Form.Item>
                                <ReCAPTCHA
                                    ref={captcha}
                                    sitekey="6LdaOYonAAAAAEOSD7wWnV6Tsi9wjj7QSs4SBjd5"
                                    onChange={handleCaptchaChange}
                                />
                            </Form.Item>
                            <Form.Item className="register ">
                                <Button type='primary' loading={loading} htmlType='submit' className='w-full border-none text-white hover:text-white bg-[#2E7EFF] hover:bg-[#4D91FF] font-inter text-[16px]'>Giriş Yap</Button>
                            </Form.Item>
                        </Form>
                        <div className="login-label flex flex-col justify-center gap-2 items-center">
                            <label className=' text-center font-inter text-[16px]'>Henüz bir hesabın yok mu?</label>
                            <a className='text-center w-fit text-[#5E62AA] font-inter text-[16px] cursor-pointer' onClick={() => navigate('/register', { replace: true })}>Kayıt Ol</a>
                        </div>
                    </div>
                </div>
                <div className="banner-section lg:w-[60%] w-0 h-full bg-[#797EDB] flex justify-center items-center">
                    <img className=' object-cover w-[80%] h-auto' src="https://i.hizliresim.com/ru1waq2.png" alt="" />
                </div>
            </div>
        </div>
    )
}

export default Login;
