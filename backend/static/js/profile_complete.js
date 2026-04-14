// Phone: digits only, max 10
const phoneInput = document.querySelector('input[name="phone"]');
if (phoneInput) {
    phoneInput.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').slice(0, 10);
    });
}

// Show/hide skills field based on role selection
const skillsField = document.getElementById('skills-field');
document.querySelectorAll('.role-card input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
        document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
        if (radio.checked) {
            radio.closest('.role-card').classList.add('selected');
            skillsField.style.display = radio.value === 'participant' ? 'block' : 'none';
        }
    });
});

// Skills tag input
const skillsInput  = document.getElementById('skillsInput');
const skillsTags   = document.getElementById('skillsTags');
const skillsHidden = document.getElementById('skillsHidden');
const skillsWrap   = document.getElementById('skillsWrap');
let skills = [];

function syncCheckboxes() {
    document.querySelectorAll('.qp-chip input[type="checkbox"]').forEach(cb => {
        cb.checked = skills.includes(cb.value);
    });
}

function renderTags() {
    skillsTags.innerHTML = '';
    skills.forEach((skill, i) => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag';
        tag.innerHTML = `${skill} <button type="button" aria-label="Remove ${skill}">&times;</button>`;
        tag.querySelector('button').addEventListener('click', () => {
            skills.splice(i, 1);
            syncCheckboxes();
            renderTags();
        });
        skillsTags.appendChild(tag);
    });
    skillsHidden.value = skills.join(',');
}

if (skillsInput) {
    skillsWrap.addEventListener('click', () => skillsInput.focus());

    skillsInput.addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ',') && skillsInput.value.trim()) {
            e.preventDefault();
            const val = skillsInput.value.trim().replace(/,$/, '');
            if (val && !skills.includes(val) && skills.length < 10) {
                skills.push(val);
                renderTags();
            }
            skillsInput.value = '';
        }
        if (e.key === 'Backspace' && !skillsInput.value && skills.length) {
            skills.pop();
            syncCheckboxes();
            renderTags();
        }
    });
}

// Quick-pick checkboxes sync with tag list
document.querySelectorAll('.qp-chip input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
        const val = cb.value;
        if (cb.checked) {
            if (!skills.includes(val) && skills.length < 10) {
                skills.push(val);
            } else {
                cb.checked = false; // cap at 10
            }
        } else {
            skills = skills.filter(s => s !== val);
        }
        renderTags();
    });
});

// Cursor glow
document.addEventListener("mousemove", e => {
    document.documentElement.style.setProperty("--mx", e.clientX + "px");
    document.documentElement.style.setProperty("--my", e.clientY + "px");
});
