import React, { useState } from "react";
import { Menu, Button, Drawer } from "antd";
import { MenuOutlined, UserOutlined, CloseOutlined } from "@ant-design/icons";
import { useNavigate } from 'react-router-dom';

const NavMenu = (props) => {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState("1");
  const navigate = useNavigate();


  const showDrawer = () => {
    setVisible(true);
  };

  const onClose = () => {
    setVisible(false);
  };
  const Profil = (e) => {
    
    setCurrent(e.key);
    navigate('/profile', { replace: true });
  };
  const Geri_Bildirim = (e) => {
    
    setCurrent(e.key);
    props.setFeedbackModalVisible(true);
    
  };
  
  const Destek = (e) => {
     window.location.href = "mailto:support@todo.bugasoft.com";
    setCurrent(e.key);
  };
  const Anasayfa = (e) => {
    navigate('/home', { replace: true });
    setCurrent(e.key);
  };
  const menuItems = [
    {onClick: Anasayfa, key: '1', label: 'Anasayfa',className:" flex flex-col justify-center items-center text-white text-center px-10 py-7 font-inter font-light text-[18px] transition-all" },
    {onClick: Profil, key: '2', label: 'Profil',className:" flex flex-col justify-center items-center text-white text-center px-10 py-7 font-inter font-light text-[18px] transition-all"  },
    {onClick: Geri_Bildirim, key: '3', label: 'Geri Bildirim' ,className:" flex flex-col justify-center items-center text-white text-center px-10 py-7 font-inter font-light text-[18px] transition-all" },
    
    {onClick: Destek, key: '5', label: 'Destek',className:" flex flex-col justify-center items-center text-white text-center px-10 py-7 font-inter font-light text-[18px] transition-all"  }
  ];

  const renderMenuContent = () => (
    <div className="flex flex-col h-full justify-between bg-[#2E7EFF] py-10">
      {/* Profil Bölümü */}
      <div className="flex flex-col items-center gap-10">
        <div className="w-24 h-24 rounded-full flex flex-col items-center justify-center w-[90%] gap-3">
        <svg className="w-14 h-14 text-white dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.5" d="M10 19a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0a8.949 8.949 0 0 0 4.951-1.488A3.987 3.987 0 0 0 11 14H9a3.987 3.987 0 0 0-3.951 3.512A8.948 8.948 0 0 0 10 19Zm3-11a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
  </svg>
  <span className="w-full text-[18px] font-light font-inter text-center text-white">{props.usernamesurname}</span>
        </div>
        
        
      </div>

      {/* Menü Bölümü */}
      
      <Menu selectedKeys={[props.currentpage]} mode="vertical" items={menuItems} className="text-white w-full font-inter font-light text-[18px]" />
      
      {/* Logo Bölümü */}
      <div className="self-center mb-4">
        <img className="w-[120px] h-auto" src="https://i.hizliresim.com/8diatf3.png" alt="Logo" />
      </div>
    </div>
  );

  return (
    <div className="w-[30px] lg:w-[300px] h-screen fixed left-0 top-0 z-10">
      <div className="lg:hidden ">
        <Button type="primary" onClick={showDrawer} className="m-4 bg-[#2E7EFF] flex flex-col justify-center items-center rounded-none fixed top-0 left-0 ">
          <MenuOutlined />
        </Button>
        <Drawer
          placement="left"
          closable={true}
          onClose={onClose}
          open={visible}
          bodyStyle={{ padding: 0 }}
          headerStyle={{ backgroundColor: '#2E7EFF', border: 'none' }}
          closeIcon={
            <div className="kapsayici">
              <Button className="flex flex-row items-center rounded-none border-none justify-center " shape="" icon={<CloseOutlined  className="text-white hover:text-white " />} onClick={onClose} />
            </div>
          }
        >
          {renderMenuContent()}
        </Drawer>
      </div>
      <div className="hidden z-0 lg:block h-screen">
        {renderMenuContent()}
      </div>
    </div>
  );
};

export default NavMenu;
