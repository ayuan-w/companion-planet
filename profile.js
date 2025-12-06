document.addEventListener('DOMContentLoaded', () => {
    
    const saveBtn = document.getElementById('saveBtn');
    const backBtn = document.getElementById('backBtn');
    const stageGroup = document.getElementById('stage-group');
    const genderGroup = document.getElementById('gender-group');

    // 1. 加载已保存的数据
    function loadProfile() {
        const rawProfile = localStorage.getItem('userProfile');
        if (rawProfile) {
            const profile = JSON.parse(rawProfile);
            
            if (profile.stage) {
                document.querySelector(`input[name="stage"][value="${profile.stage}"]`).checked = true;
            }
            if (profile.gender) {
                document.querySelector(`input[name="gender"][value="${profile.gender}"]`).checked = true;
            }
        }
    }

    // 2. 保存数据
    function saveProfile() {
        const selectedStage = document.querySelector('input[name="stage"]:checked');
        const selectedGender = document.querySelector('input[name="gender"]:checked');

        if (!selectedStage || !selectedGender) {
            alert("请选择年龄阶段和偏好！");
            return;
        }

        const profileData = {
            stage: selectedStage.value,
            gender: selectedGender.value
        };

        // 保存到 localStorage
        localStorage.setItem('userProfile', JSON.stringify(profileData));
        
        alert("保存成功！");
        window.location.href = 'main.html'; // 保存后自动返回主页
    }

    // 3. 返回按钮
    backBtn.addEventListener('click', () => {
        window.location.href = 'main.html';
    });

    // 4. 保存按钮
    saveBtn.addEventListener('click', saveProfile);

    // 页面加载时自动填充已选项
    loadProfile();
});