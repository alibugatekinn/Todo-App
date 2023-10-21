import React from 'react'
import { Progress } from 'antd';
import dayjs from 'dayjs';
import { useAutoAnimate } from '@formkit/auto-animate/react'
const TaskCard = (props) => {
    
    return (
        <div onClick={() => {
            
            props.setTaskName(props.taskName);
            props.setTarget(props.target);
            props.setStartDate(props.startDate);
            props.setEndDate(props.endDate);
            props.setDescription(props.description);
            props.setProgress(props.progress);
            props.setpriority(props.priority)
            props.setmodaltype("update");
            props.setselectedCard(props.card)
            props.setModalVisible(true);
               


        }}     className='card-animation hover:shadow-md w-full xl:w-full min-w-[320px] lg:w-fit rounded-xl border shadow-sm flex flex-row justify-center items-center p-3 cursor-pointer'
        >
            <div className='w-[40%] h-full flex flex-col justify-center items-center'>
            <Progress 
    type="circle" 
    percent={props.progress} 
    strokeColor={props.progress === 100 ? { '0%': '#108ee9', '100%': '#87d068' } : props.color} 
/>

            </div>
            <div className='w-[60%] h-full flex flex-col justify-center items-center gap-2'>
                <h1
                    className='font-inter text-[17px] text-center text-[#000000bf] font-semibold whitespace-nowrap overflow-hidden truncate w-[160px]'
                    title={props.taskName}
                >
                    {props.taskName}
                </h1>

                <h2
                    className='font-inter text-[17px] text-center text-black font-light whitespace-nowrap overflow-hidden truncate w-[160px]'
                    title={props.target}
                >
                    {props.target}
                </h2>
                <h2 className='font-inter text-[17px] text-black font-light'>{props.endDate}</h2>
                <div style={{
                    width: '50%',
                    textAlign: 'center',
                    borderRadius: '10px',
                    backgroundColor: props.priorityColor,
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: '300'
                }}>
                    {props.priority}
                </div>

            </div>
        </div>
    )
}

export default TaskCard