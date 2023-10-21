import React from 'react';
import { Space, Table, Tag } from 'antd';
import { EyeOutlined, DeleteOutlined } from "@ant-design/icons";


const TaskTable = (props) => {





    const { completedtasks } = props;
    const columns = [
        {
            title: 'Görev Adı',
            dataIndex: 'name',
            key: 'name',
            fixed: 'left',
            width: 150,
            align:"center",
            render: text => <a>{text}</a>,
        },
        {
            title: 'Hedef',
            dataIndex: 'target',
            key: 'target',
            width: 150,
            align:"center",
        },
        {
            title: 'Başlangıç Tarihi',
            dataIndex: 'startDate',
            key: 'startDate',
            width: 150,
            align:"center",
        },
        {
            title: 'Bitiş Tarihi',
            dataIndex: 'endDate',
            key: 'endDate',
            width: 150,
            align:"center",
        },
        {
            title: 'Öncelik',
            dataIndex: 'priority',
            key: 'priority',
            width: 150,
            align:"center",
            render: priority => {
                let color;
    
                switch (priority) {
                    case 'Düşük':
                        color = '#FF0303';
                        break;
                    case 'Orta':
                        color = '#FFA701';
                        break;
                    case 'Yüksek':
                        color = '#64DA9B';
                        break;
                    default:
                        color = 'gray'; // Eğer beklenmedik bir değer gelirse
                }
    
                return <Tag color={color} style={{ color: 'white' }}>{priority}</Tag>;
            },
        },
        
        {
            title: 'İşlem Yap',
            fixed: 'right',
            key: 'action',
            width: 100,
            align:"center",
            render: (text, record) => (
                <Space size="middle">
                    <a onClick={() => handleViewClick(record.key)}>
                    <EyeOutlined style={{ color: 'blue', fontSize: '24px' }} />

                    </a>
                    <a onClick={() => {props.setselectedCard(record.key); props.settaskdeletemodalopen(true); }}>
                    <DeleteOutlined style={{ color: 'red', fontSize: '20px' }} />

                    </a>
                </Space>
            ),
        },
    ];
      const data = completedtasks.map(task => ({
        key: task.id,
        name: task.name,
        target: task.target,
        endDate: task.endDate,
        startDate: task.startDate,
        description: task.description,
        priority: task.priority,
        color: task.color,
        progress: task.progress,
        priorityColor: task.priorityColor,
    }));


    const handleViewClick = (recordKey) => {
        // İlgili kaydı completedtasks dizisi içerisinde arayalım
        const matchedTask = completedtasks.find(task => task.id === recordKey);
      
        // Eşleşen bir kayıt bulunduysa ilgili state'lere bu değerleri ayarlayalım
        if (matchedTask) {
          props.setTaskName(matchedTask.name);
          props.setTarget(matchedTask.target);
          props.setStartDate(matchedTask.startDate);
          props.setEndDate(matchedTask.endDate);
          props.setDescription(matchedTask.description);
          props.setProgress(matchedTask.progress);
          props.setpriority(matchedTask.priority);
          props.setselectedCard(matchedTask.id); // Eğer selectedCard bu görevin ID'sini tutacaksa
      
          // Eğer modal tipini veya görünürlüğünü değiştirmek isterseniz, bu değerleri de burada ayarlayabilirsiniz.
          // Örneğin:
           props.setmodaltype("completed");
           props.setModalVisible(true);
        } else {
          console.error("Eşleşen kayıt bulunamadı!");
          
        }
      };
      



  return (
    <div className='w-[400px] md:w-[700px] lg:w-[600px] xl:w-[100vh] transition-all card-animation2 '>
        <Table  columns={columns} dataSource={data} pagination={{ pageSize: 10 }} bordered
    size="middle" scroll={{ x: 'max-content' }} 
    />
    </div>
    
    

  )
}

export default TaskTable


