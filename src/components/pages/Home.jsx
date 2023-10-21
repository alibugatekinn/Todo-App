import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, sendEmailVerification, signOut } from 'firebase/auth';
import { Modal, Button, notification, Progress, Form, Input, DatePicker, Pagination, Space, Table, Tag } from 'antd';
import { auth, db } from '../../FirebaseConfig';
import { useNavigate } from 'react-router-dom';
import NavMenu from '../../Menu/NavMenu';
import TaskCard from "../../task_card/TaskCard"
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { doc, setDoc } from "firebase/firestore";
import { collection, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { query, where, getDocs, getDoc } from "firebase/firestore";
import dayjs from 'dayjs';
import 'dayjs/locale/tr';  // locale eklentisini içe aktarın
import TaskTable from '../../task table/TaskTable';
import ReCAPTCHA from "react-google-recaptcha";
import format from 'date-fns/format';
import * as Sentry from "@sentry/react";


const Home = ({isFeedbackModalVisible,setFeedbackModalVisible,usernamesurname}) => {
  dayjs.locale('tr');
  const [feedbackbuttonloading, setfeedbackbuttonloading] = useState(false);
  const [taskdeletemodalopen, settaskdeletemodalopen] = useState(false);
  const [comebacktaskloading, setcomebacktaskloading] = useState(false);
  const [compeletaskloading, setcompeletaskloading] = useState(false);
  const [updatetaskloading, setupdatetaskloading] = useState(false);
  const [deletetaskloading, setdeletetaskloading] = useState(false);
  const [containerloading, setcontainerLoading] = useState(true);
  const [containerloading2, setcontainerLoading2] = useState(true);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentpage, setcurrentpage] = useState();
  const [email, setEmail] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [addTaskLoading, setAddTaskLoading] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const formRef = useRef(null);
  const [taskState, setTaskState] = useState('aktif');
  const [taskName, setTaskName] = useState('');
  const [target, setTarget] = useState('');
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [description, setDescription] = useState('');
  const [priority, setpriority] = useState('Düşük');
  const [progress, setProgress] = useState(0);
  const [dataloading, setdataloading] = useState(true);
  const [selectedCard, setselectedCard] = useState("");
  const [priorityColor, setpriorityColor] = useState("");
  const [modaltype, setmodaltype] = useState("add");
  const [modalkey, setmodalkey] = useState(1);
  const [tasks, setTasks] = useState([]);
  const [completedtasks, setcompletedtasks] = useState([]);

  
  const [feedbackDescription, setFeedbackDescription] = useState("");
  const [isFeedbackCaptchaVerified, setFeedbackCaptchaVerified] = useState(false);
  const feedbackcaptcharef = useRef(null);
  const [feedbackform] = Form.useForm();




  const handleFeedbackSubmit = async () => {
    setfeedbackbuttonloading(true);
    
    if (!isFeedbackCaptchaVerified) {
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
    setFeedbackCaptchaVerified(false);
    setFeedbackDescription(null);
    feedbackform.resetFields();
    setFeedbackModalVisible(false);

  }

  /////sayfa ilk yüklendiğinde gerçekleşecek işlemler
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (!user.emailVerified) {
          // Eğer e-posta doğrulanmamışsa bir uyarı göster
          setIsModalOpen(true);
          setUser(user);
        }
        setcurrentpage("1");
        setEmail(user.email);
        // Fonksiyonu kullanın
        fetchActiveTasks(user.email);
        fetchCompletedTasks(user.email)
        

          ;

      }
      else {
        // E-posta doğrulandıysa ana sayfaya yönlendir
        navigate('/', { replace: true });
      }
    });

    return () => unsubscribe();
  }, []);


  useEffect(() => {
    if (priority === "Düşük") {
      setpriorityColor("#FF4D4C");
    }
    if (priority === "Orta") {

      setpriorityColor("#FFA701");
    }
    if (priority === "Yüksek") {

      setpriorityColor("#64DA9B");
    }
  }, [priority]);


  /////modallarda formun doğru doldurulduğundan emin olmak için formu doğrulayan kod
  const handleFormSubmit = () => {
    formRef.current.submit(); // Bu, formu programatik olarak submit eder
  };



  ////görev modallarında progress bar üzerinde değişiklik yapan kodlar
  const [percent, setPercent] = useState(0);
  const increase = () => {
    setProgress((prevPercent) => {
      const newPercent = prevPercent + 10;
      if (newPercent > 100) {
        setProgress(100);
        return 100;
      }
      setProgress(newPercent);
      return newPercent;
    });
  };

  const decline = () => {
    setProgress((prevPercent) => {
      const newPercent = prevPercent - 10;
      if (newPercent < 0) {
        setProgress(0);
        return 0;
      }
      setProgress(newPercent);
      return newPercent;
    });
  };

  function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }



  ////aktif görevleri getirir
  async function fetchActiveTasks(email) {
    // Kullanıcının belgesini belirt
    const userDocRef = doc(db, "users", email);

    // Kullanıcının 'tasks' koleksiyonu için bir sorgu oluşturun ve taskState: 'aktif' olanları filtreleyin
    const q = query(collection(userDocRef, 'tasks'), where('taskState', '==', 'aktif'));

    // Sorguyu çalıştırın
    const querySnapshot = await getDocs(q);

    // Görevleri bir diziye ekleyin
    let tasks = [];
    querySnapshot.forEach((doc) => {
      let taskData = doc.data();

      tasks.unshift({
        id: doc.id,
        name: taskData.name,
        target: taskData.target,
        endDate: taskData.endDate,
        startDate: taskData.startDate,
        description: taskData.description,
        priority: taskData.priority,
        color: taskData.color,
        progress: taskData.progress,
        priorityColor: taskData.priorityColor
        // ... diğer alanlarınızı da buraya ekleyebilirsiniz
      });

    });

    setTasks(tasks);

    setdataloading(false);
    setcontainerLoading(false);
    
  }


  ////tamamlanmış görevleri getirir
  async function fetchCompletedTasks(email) {
    // Kullanıcının belgesini belirt
    const userDocRef = doc(db, "users", email);

    // Kullanıcının 'tasks' koleksiyonu için bir sorgu oluşturun ve taskState: 'aktif' olanları filtreleyin
    const q = query(collection(userDocRef, 'tasks'), where('taskState', '==', 'tamamlandı'));

    // Sorguyu çalıştırın
    const querySnapshot = await getDocs(q);

    // Görevleri bir diziye ekleyin
    let tasks = [];
    querySnapshot.forEach((doc) => {
      let taskData = doc.data();

      tasks.unshift({
        id: doc.id,
        name: taskData.name,
        target: taskData.target,
        endDate: taskData.endDate,
        startDate: taskData.startDate,
        description: taskData.description,
        priority: taskData.priority,
        color: taskData.color,
        progress: 100,
        priorityColor: taskData.priorityColor
        // ... diğer alanlarınızı da buraya ekleyebilirsiniz
      });

    });

    setcompletedtasks(tasks);

    setdataloading(false);
    setcontainerLoading2(false);
  }




  ///// mail doğrulaması ekranındaki çıkış yap butonunda çalışan kod
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Modal'ı kapat
      setIsModalOpen(false);
      // Çıkış başarılı olduğunda bir bildirim gösterebilirsiniz veya başka bir işlem yapabilirsiniz
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  ///// e mail doğrulama linki gönderen kod
  const sendVerificationLink = async () => {
    setIsLoading(true); // Yüklenme başladığında butonu disable yap
    const currentUser = auth.currentUser;

    if (!currentUser) {
      notification.info({
        message: 'Bilgi',
        description: 'Kullanıcı oturumu bulunamadı!',
        placement: 'topRight'
      });
      setIsLoading(false);
      navigate('/', { replace: true });
      return;
    }
    try {
      await sendEmailVerification(currentUser);
      // Başarılı bildirimini göster
      notification.success({
        message: 'Başarılı!',
        description: 'Doğrulama bağlantısı başarıyla gönderildi.',
        placement: 'topRight'
      });
    } catch (error) {
      
      // Hata bildirimini göster
      notification.error({
        message: 'Hata!',
        description: 'Doğrulama bağlantısı gönderilirken bir hata oluştu.',
        placement: 'topRight'
      });
      Sentry.captureException(error);
    }

    setIsLoading(false);
  };

  //// kullanıcıyı logout yapan kod
  const logoutUser = async () => {
    try {
      await signOut(auth);
      // Çıkış başarılı olduğunda bir bildirim göster
      notification.success({
        message: 'Başarılı!',
        description: 'Başarılı bir şekilde çıkış yapıldı.',
        placement: 'topRight'
      });
    } catch (error) {
      // Hata bildirimi (isterseniz ekleyebilirsiniz)
      notification.error({
        message: 'Hata!',
        description: 'Çıkış yapılırken bir hata oluştu.',
        placement: 'topRight'
      });
    }
  };


  ////// görevler dizisi


  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;


  const updateTaskDetails = async () => {
    setupdatetaskloading(true);
    
    const userDocRef = doc(db, "users", email);
    const taskDocRef = doc(userDocRef, "tasks", selectedCard);

    // Belgenin var olup olmadığını kontrol et
    const taskSnapshot = await getDoc(taskDocRef);

    if (taskSnapshot.exists()) { // Eğer belge varsa güncelle


      const taskData = {
        name: taskName,
        target: target,
        startDate: startDate,
        endDate: endDate,
        description: description,
        priority: priority,
        progress: progress,


        priorityColor: priorityColor
      };

      try {
        await updateDoc(taskDocRef, taskData);
        notification.success({
          message: 'Başarılı',
          description: 'Görev başarıyla güncellendi.',
          placement: 'topRight',
        });
      } catch (error) {
        notification.error({
          message: 'Hata',
          description: 'Görev güncellenirken bir sorun oluştu.',
          placement: 'topLeft',
        });
        Sentry.captureException(error);
      }
    } else {
      notification.error({
        message: 'Hata',
        description: 'Görev bulunamadı, bu nedenle güncellenemedi.',
        placement: 'topLeft',
      });
      
    }

    fetchActiveTasks(email);
    setupdatetaskloading(false);
    handleCloseModal();
    fetchCompletedTasks(email);

  };


  async function deleteTaskAndFetch() {
    settaskdeletemodalopen(false);
    setdeletetaskloading(true);
    const userDocRef = doc(db, "users", email);
    const taskDocRef = doc(userDocRef, "tasks", selectedCard);

    try {
      // Dökümanı sil
      await deleteDoc(taskDocRef);

      // Başarılı bir şekilde silindiğini bildir
      notification.success({
        message: 'Başarılı',
        description: 'Görev başarıyla silindi.'
      });

      // Diğer fonksiyonları çağır
      fetchActiveTasks(email);
      handleCloseModal();

    } catch (error) {
      // Eğer bir hata oluşursa, hatayı bildir
      notification.error({
        message: 'Hata',
        description: 'Görev silinirken bir hata oluştu.'
      });
      console.error("Döküman silinirken hata oluştu:", error);
      
    }
    setdeletetaskloading(false);
    fetchCompletedTasks(email);
  }



  async function completeTask(email, taskId) {
    setcompeletaskloading(true);
    try {
      const taskRef = doc(db, 'users', email, 'tasks', taskId);
      await updateDoc(taskRef, {
        taskState: 'tamamlandı',
        progress: 100
      });

      // Görev tamamlandığında bildirim göster
      notification.success({
        message: 'Başarılı!',
        description: 'Görev başarıyla tamamlandı.',
        placement: 'topRight'  // Ekranın sağ üst köşesinde göster
      });

    } catch (error) {
      // Başarısız olursa error bildirimi göster
      notification.error({
        message: 'Hata!',
        description: 'Görevi tamamlarken bir sorun oluştu.',
        placement: 'topLeft'  // Ekranın sol üst köşesinde göster
      });
      Sentry.captureException(error);
    }
    fetchActiveTasks(email);
    setcompeletaskloading(false);
    handleCloseModal();
    fetchCompletedTasks(email)

  }


  async function comebacktask(email, taskId) {
    setcomebacktaskloading(true);
    try {
      const taskRef = doc(db, 'users', email, 'tasks', taskId);
      await updateDoc(taskRef, {
        taskState: 'aktif'
      });

      // Görev tamamlandığında bildirim göster
      notification.success({
        message: 'Başarılı!',
        description: 'Görev geri alındı.',
        placement: 'topRight'  // Ekranın sağ üst köşesinde göster
      });

    } catch (error) {
      // Başarısız olursa error bildirimi göster
      notification.error({
        message: 'Hata!',
        description: 'Görevi geri alınırken bir sorun oluştu.',
        placement: 'topLeft'  // Ekranın sol üst köşesinde göster
      });
      Sentry.captureException(error);
    }
    fetchActiveTasks(email);
    setcomebacktaskloading(false);
    handleCloseModal();
    fetchCompletedTasks(email)

  }

  /////yeni görev ekleyen kod
  const setUserDetails = async () => {
    setAddTaskLoading(true);
    // Kullanıcı belgesini e-posta adresine göre oluşturun
    const userDocRef = doc(db, "users", email);
    // Görev koleksiyonunu alın
    const tasksCollection = collection(userDocRef, 'tasks');

    const randomIndex = Math.floor(Math.random() * colors.length);



    // Görev verilerini oluştur
    const taskData = {
      name: taskName,
      target: target,
      startDate: startDate,
      endDate: endDate,
      description: description,
      priority: priority,
      progress: progress,
      taskState: 'aktif',     // Görevin başlangıç durumunu "aktif" olarak belirttik
      color: colors[randomIndex],
      priorityColor: priorityColor
    };
    await addDoc(tasksCollection, taskData);
    try {
      // Görevi veritabanına ekleyin

      // Başarılı bildirimi sağda göster
      notification.success({
        message: 'Başarılı',
        description: 'Görev başarıyla eklendi.',
        placement: 'topRight',
      });
      // İşlem başarılı olduğu için modalı kapat

    } catch (error) {
      // Hata bildirimi solda göster
      notification.error({
        message: 'Hata',
        description: 'Görev eklenirken bir sorun oluştu.',
        placement: 'topLeft',
      });
      Sentry.captureException(error);
      // İşlemde bir hata olduğu için modalı kapat

    }
    handleCloseModal();
    fetchActiveTasks(email);
    setAddTaskLoading(false);

  };

  /////yeni görev ekleyen kodu çağırır
  const onFinish = (values) => {

    setUserDetails();
  };

  const onFinishFailed = (errorInfo) => {
    console.error('Form gönderimi başarısız:', errorInfo);
  };

  //// verileri temizleyip modalı kapatır
  const handleCloseModal = () => {
    // Modalı kapat

    setmodalkey(getRandomNumber(1, 100000));
    setModalVisible(false);

    // Diğer state'leri sıfırla
    setTaskName("");
    setTarget("");
    setStartDate(null);
    setEndDate(null);
    setDescription('');
    setProgress(0);
    setmodaltype("add");
    setPercent(0);

    // Eğer formRef tanımlıysa, formun içeriğini sıfırla
    if (formRef.current) {
      formRef.current.resetFields();
    }
  };


  const handleCaptchaChange = () => {
    setFeedbackCaptchaVerified(true);
  };
  ///// görev renkleri
  const colors = ['#6528F7', '#FF8400', '#FB2576', '#2192FF', '#14C38E', '#143F6B', '#548CFF', '#F7EA00', '#00AF91', '#FF5200', '#2FC4B2', '#EFA8E4', '#C355F5', '#FD5D5D', '#00BD56', '#207DFF', '#FF2E63', '#E07A5F', '#FF6969', '#F78DA7', '#58B19F', '#FFA45B', '#9B5DE5', '#F15BB5', '#FEE440', '#00BBF9', '#FFD447', '#FF70A6', '#8338EC'];

  function getRandomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
  }

  //// öncelik renkleri
  const priorityColors = {
    Düşük: "#FF4D4C",
    Orta: "#FFA701",
    Yüksek: "#64DA9B"
  };
  return (
    <div className="h-screen w-screen overflow-hidden  flex flex-row">
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
      <Modal
        className=' z-20'
        title="Görev Sil"
        open={taskdeletemodalopen}
        onCancel={() => { settaskdeletemodalopen(false) }}
        centered={true}
        footer={[
          <Button key="back" onClick={() => settaskdeletemodalopen(false)} style={{ backgroundColor: "#FF4D4C", color: "white" }}>
            Hayır
          </Button>,
          <Button key="submit" type="primary" onClick={deleteTaskAndFetch} style={{ backgroundColor: "#65DA9B", color: "white" }}>
            Evet
          </Button>,
        ]}
      >
        Görev verileri tamamen silinecektir, emin misiniz?
      </Modal>
      <Modal
        key={"emailverfmodal"}
        title="Eposta Doğrulanmadı"
        open={isModalOpen}
        closable={false}
        footer={[<div key="desc2" className='flex flex-col justify-center items-center'>
          <Button
            key="resend"
            type="primary"
            loading={isLoading}
            onClick={sendVerificationLink}
            className=' w-fit border-none text-[16px] font-inter font-normal  text-white hover:text-white bg-[#2E7EFF] hover:bg-[#4D91FF] font-inter text-[16px] mt-3 text-center px-3'
          >
            Doğrulama Bağlantısını Tekrar Gönder
          </Button>
          <Button
            key="logout"
            type="default"
            onClick={handleLogout}
            className='w-fit px-5 border-none mt-3 text-center text-[16px] font-normal font-inter  bg-red-500 hover:bg-red-400 text-white'
          >
            Çıkış Yap
          </Button>
        </div>

        ]}
        destroyOnClose={true}
        centered={true}
      >
        <div key="desc" className='px-5'>
          <p>E-posta adresinizi doğrulamadan Bugasoft servislerine erişemezsiniz.</p>
          <p>Doğrulama bağlantısı e-posta adresinize gönderilmiştir. Lütfen gelen kutunuzu kontrol edin. E-posta Doğrulama bağlantılarını içeren postalar spam-gereksiz kutularına düşebilir. Gelen kutusunda bu postaları göremezseniz ilk olarak spam-gereksiz kutularını kontrol etmelisiniz.</p>
          <p><b>Not:</b> E-postası doğrulanmayan kullanıcı hesapları 3 gün içerisinde silinecektir.</p>
          <p className=' text-green-500'><b>Doğrulamayı zaten yaptıysanız lütfen sayfayı yenileyiniz.</b></p>
        </div>
      </Modal>
      <Modal
        title={
          modaltype === "add" ?
            [<div className='text-[23px] font-inter font-normal text-center'>Görev Ekle</div>]
            :
            modaltype === "update" ?
              [<div className='text-[23px] font-inter font-normal text-center'> Aktif Görev</div>]
              :
              modaltype === "completed" ?
                [<div className='text-[23px] font-inter font-normal text-center'> Tamamlanan Görev</div>]
                : []
        }
        className='font-inter z-10'
        open={modalVisible}
        centered={true}
        onCancel={handleCloseModal}
        key={modalkey}
        footer={
          modaltype === "add" ?
            [
              <Button
                className='w-full'
                key="submit"
                loading={addTaskLoading}
                htmlType="submit"
                type="primary"
                onClick={handleFormSubmit}
                style={{ backgroundColor: '#65DA9B' }}
              >
                Ekle
              </Button>
            ]
            : modaltype === "update" ?
              [
                <div className='flex flex-row justify-center items-center'><Button
                  className='w-full'
                  key="delete"
                  type="primary"

                  onClick={() => { handleCloseModal(); settaskdeletemodalopen(true) }}
                  style={{ backgroundColor: '#FF4D4C' }}
                >
                  Sil
                </Button>
                  <Button
                    className='w-full'
                    key="update"
                    type="primary"
                    loading={updatetaskloading}
                    onClick={updateTaskDetails}
                    style={{ backgroundColor: '#FFA701' }}
                  >
                    Güncelle
                  </Button>
                  <Button
                    className='w-full'
                    key="complete"
                    type="primary"
                    loading={compeletaskloading}
                    onClick={() => { completeTask(email, selectedCard) }}
                    style={{ backgroundColor: '#64DA9B' }}
                  >
                    Tamamla
                  </Button></div>

              ]
              : modaltype === "completed" ?
                [
                  <div className='flex flex-row justify-center items-center'><Button
                    className='w-full'
                    key="delete"
                    type="primary"
                    loading={deletetaskloading}
                    onClick={() => { handleCloseModal(); settaskdeletemodalopen(true) }}
                    style={{ backgroundColor: '#FF4D4C' }}
                  >
                    Sil
                  </Button>
                    <Button
                      className='w-full'
                      key="update"
                      type="primary"
                      loading={updatetaskloading}
                      onClick={updateTaskDetails}
                      style={{ backgroundColor: '#FFA701' }}
                    >
                      Güncelle
                    </Button>
                    <Button
                      className='w-full'
                      key="complete"
                      type="primary"
                      loading={comebacktaskloading}
                      onClick={() => { comebacktask(email, selectedCard) }}
                      style={{ backgroundColor: '#64DA9B' }}
                    >
                      Geri Al
                    </Button></div>

                ]
                : []
        }

      >
        <Form
          key={"form"}
          onFinish={onFinish}
          ref={formRef}
          layout="vertical"

        >
          <Form.Item
            key={"taskname"}
            name="taskName"
            label={<label className='font-inter text-[17px] font-normal'>Görev Adı</label>}
            rules={[
              { required: true, message: 'Lütfen Görev Adı girin!' },
              { max: 30, message: 'Görev Adı en fazla 30 karakter olmalıdır!' },
              { pattern: /[^\s]/, message: 'Sadece boşluk karakteri kullanılamaz!' },
              { pattern: /^[^<>]*$/, message: 'HTML etiketleri kullanılamaz!' }
            ]}
          >
            <Input
              defaultValue={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Görev adını girin"
            />
          </Form.Item>

          <Form.Item
            key={"tasktarget"}
            name="target"
            label={<label className='font-inter text-[17px] font-normal'>Hedef</label>}
            rules={[
              { required: true, message: 'Hedef bilgisi zorunludur.' },
              { max: 30, message: 'Maksimum 30 karakter olabilir.' },
              { pattern: /[^\s]/, message: 'Sadece boşluk karakteri kullanılamaz!' },
              { pattern: /^[^<>]+$/, message: 'HTML etiketleri kullanılamaz.' }
            ]}
          >
            <Input
              defaultValue={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Hedefi girin"
            />
          </Form.Item>

          <div key={"groupitems"} className=' w-full flex flex-row justify-between items-center '>
            <Form.Item
              key={"taskstartdate"}
              name="startDate"
              label={<label className='font-inter text-[17px] font-normal'>Başlangıç Tarihi</label>}
              rules={[{ required: true, message: 'Başlangıç tarihi zorunludur.' }]}
            >
              <DatePicker

                defaultValue={startDate ? dayjs(startDate, 'YYYY-MM-DD') : null}
                onChange={(date, dateString) => {
                   // Seçilen tarihi 'YYYY-MM-DD' formatında konsola yazar.
                  setStartDate(dateString);
                }}

                className='w-[150px] lg:w-[200px] md:w-[200px] font-inter text-[17px] border border-[0.5px] shadow-sm font-normal'

              />
            </Form.Item>

            <Form.Item

              key={"taskenddate"}
              name="endDate"
              label={<label className='font-inter text-[17px] font-normal'>Bitiş Tarihi</label>}
              rules={[{ required: true, message: 'Bitiş tarihi zorunludur.' }]}
            >
              <DatePicker
                defaultValue={endDate ? dayjs(endDate, 'YYYY-MM-DD') : null}
                onChange={(date, dateString) => {
                   // Seçilen tarihi 'YYYY-MM-DD' formatında konsola yazar.
                  setEndDate(dateString);
                }}
                className='w-[150px] lg:w-[200px] md:w-[200px] font-inter text-[17px] font-normal border shadow-sm border-[0.5px]'

              />
            </Form.Item>
          </div>

          <Form.Item
            key={"taskdescription"}
            name="description"
            label={<label className='font-inter text-[17px] font-normal'>Görev Açıklaması</label>}
            rules={[
              { max: 1500, message: 'Görev Açıklaması Maksimum 150 karakter olabilir.' },
              { pattern: /[^\s]/, message: 'Sadece boşluk karakteri kullanılamaz!' },
              { pattern: /^[^<>]+$/, message: 'HTML etiketleri kullanılamaz.' }
            ]}
          >
            <Input.TextArea
              defaultValue={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Açıklamayı girin"
            />
          </Form.Item>

          <Form.Item
            key={"taskpriority"}
            name="priority"
            label={<label className='font-inter text-[17px] font-normal'>Öncelik</label>}
          >
            <div className="flex gap-4">
              {['Düşük', 'Orta', 'Yüksek'].map((seviye) => (
                <div
                  key={seviye}
                  className={`rounded-xl px-4 py-1 cursor-pointer border shadow-sm border-[0.5px] ${priority === seviye ? "text-white" : ""}`}
                  style={{ backgroundColor: priority === seviye ? priorityColors[seviye] : 'transparent' }}
                  onClick={() => setpriority(seviye)}
                >
                  {seviye}
                </div>
              ))}
            </div>
          </Form.Item>

          <Form.Item
            key={"taskprogress"}
            name="progress"
            label={<label className='font-inter text-[17px] font-normal'>İlerleme Durumu</label>}
          >
            <div>
              <Progress percent={progress} disabled={modaltype === "completed"} />
              <Button.Group>
                <Button key={"decline"} onClick={decline} icon={<MinusOutlined />} disabled={modaltype === "completed"} />
                <Button key={"increase"} onClick={increase} icon={<PlusOutlined />} disabled={modaltype === "completed"} />
              </Button.Group>
            </div>
          </Form.Item>
        </Form>


      </Modal>

      <NavMenu usernamesurname={usernamesurname} setFeedbackModalVisible={setFeedbackModalVisible} currentpage={currentpage} />
      <div style={{ WebkitOverflowScrolling: 'touch', overflow: 'auto' }} className=" h-screen w-full bg-white   lg:w-[calc(100%_-_300px)] fixed right-0 flex flex-col items-center  py-10" >
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
        <div className='py-[1vh] lg:py-[10vh]'>
          <div className='flex flex-col justify-center items-center py-10'>
            <h1 className='text-center text-black text-[25px] font-inter font-semibold'>Aktif Görevler</h1>
          </div>
          <div className='flex flex-col items-center gap-10 w-[97%] px-2 transition-all'  >
            {
              containerloading ?
                <div role="status">
                  <svg aria-hidden="true" className="w-8 h-8 absolute left-[50%] top-[50%] text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                  </svg>
                  <span className="sr-only">Loading...</span>
                </div>

                :

                tasks.length === 0 ?
                  <div className="w-[320px] flex flex-col justify-center items-center text-center p-5 border rounded-md gap-3 rounded rounded-xl shadow-sm">
                    <p>Aktif görev bulunmuyor</p>
                    <Button onClick={() => { setModalVisible(true) }} className='bg-[#65DA9B] w-[160px] h-auto border-[#65DA9B] text-white font-inter font-light text-[18px]' >
                      Yeni Görev Ekle
                    </Button>
                  </div> :
                  <>
                    {
                      <>
                        <div className="grid row-reverse xl:grid-cols-3 lg:grid-cols-2 md:grid-cols-2 gap-10 h-fit w-fit transition-all"  >

                          {
                            tasks.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((task) => {
                              return (
                                <TaskCard

                                  key={task.id}
                                  card={task.id}
                                  taskName={task.name}
                                  target={task.target}
                                  endDate={task.endDate}
                                  startDate={task.startDate}
                                  priority={task.priority}
                                  color={task.color}
                                  description={task.description}
                                  progress={task.progress}
                                  priorityColor={task.priorityColor}
                                  modalVisible={modalVisible}
                                  setModalVisible={setModalVisible}
                                  selectedCard={selectedCard}
                                  setselectedCard={setselectedCard}
                                  setTaskName={setTaskName}
                                  setTarget={setTarget}
                                  setStartDate={setStartDate}
                                  setEndDate={setEndDate}
                                  setDescription={setDescription}
                                  setProgress={setProgress}
                                  setpriorityColor={setpriorityColor}
                                  setpriority={setpriority}
                                  setmodaltype={setmodaltype}
                                />
                              );
                            })
                          }
                        </div>
                        <Button onClick={() => { setModalVisible(true); setmodaltype("add") }} className='bg-[#65DA9B] w-[160px] h-auto border-[#65DA9B] text-white font-inter font-light text-[18px]' >
                          Yeni Görev Ekle
                        </Button>
                      </>
                    }
                    <Pagination
                      current={currentPage}
                      total={tasks.length}
                      pageSize={pageSize}
                      onChange={page => setCurrentPage(page)}
                    />
                  </>
            }


          </div>
        </div>


        {
          containerloading2 ?
            <div role="status">
              <svg aria-hidden="true" className="w-8 h-8 absolute left-[50%] top-[50%] text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
            :

            <div className='completed-tasks-div py-[1vh] lg:py-[10vh]'>
              <div className='flex flex-col justify-center items-center py-10'>
                <h1 className='text-center text-black text-[25px] font-inter font-semibold'>Tamamlanmış Görevler</h1>
              </div>
              {

                <TaskTable completedtasks={completedtasks} settaskdeletemodalopen={settaskdeletemodalopen}
                  setTaskName={setTaskName}
                  setTarget={setTarget}
                  setStartDate={setStartDate}
                  setEndDate={setEndDate}
                  setDescription={setDescription}
                  setProgress={setProgress}
                  setpriority={setpriority}
                  setmodaltype={setmodaltype}
                  setselectedCard={setselectedCard}
                  setModalVisible={setModalVisible}
                  
                />}

            </div>
        }

      </div>

    </div>
  )
}

export default Home;
