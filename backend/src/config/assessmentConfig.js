const STANDARD_WEIGHTS = {
  standard1: 0.05,
  standard2: 0.2,
  standard3: 0.1,
  standard4: 0.1,
  standard5: 0.2,
  standard6: 0.15,
  standard7: 0.1,
};

const STANDARD_QUESTIONS = {
  standard1: [
    "Does the Program have documented measurable Program Educational Objectives (PEOs) that support Department and University mission statements?",
    "Does the program have documented Program Learning Outcomes (PLOs) for graduating students?",
    "Do these PLOs align with the Program's Educational Objectives (PEOs)?",
    "Are the graduating students capable of performing these PLOs?",
    "Is there any strategic plan to achieve program objectives?",
    "Does the department assess its overall performance periodically using quantifiable measures?",
    "Is the result of the program assessment documented?",
    "Does the department take deliberate steps to engage all students as partners in assurance and enhancement of educational experience?"
  ],
  standard2: [
    "To what extent do you agree that the curriculum is well-structured and consistently aligned with documented objectives?",
    "Does the curriculum support the program's documented educational objectives?",
    "Are theoretical background, problem analysis and solution design stressed within the core material?",
    "To what extent do you agree that curriculum meets core, major and general education requirements?",
    "To what extent do you agree that IT concepts and tools are appropriately integrated across curriculum?",
    "To what extent do you agree that curriculum fosters oral and written communication skills?",
    "To what extent do you agree that student and faculty feedback is regularly used for improvement?"
  ],
  standard3: [
    "Are laboratory manuals/documentation/instructions available and accessible to faculty and students?",
    "Are there adequate support personnel for instruction and maintaining laboratories?",
    "Are infrastructure and facilities adequate to support PEOs?",
    "Are all subject specific facilities available?"
  ],
  standard4: [
    "Are courses offered in sufficient frequency and number to complete the program timely?",
    "Are courses in the major area structured to optimize interaction between students, faculty and teaching assistants?",
    "Does the university provide academic advising on program completion, course decisions and career choices?"
  ],
  standard5: [
    "Are there enough full-time faculty members for adequate coverage with continuity and stability?",
    "Are qualifications and interests of faculty sufficient to teach and update courses/curricula?",
    "Do faculty possess competence obtained through graduate work in the discipline?",
    "Are feedback surveys conducted each semester from students for teaching and assessment evaluation?",
    "Do the majority of faculty members hold a PhD degree in their discipline?",
    "Do faculty dedicate sufficient time to research to remain current in disciplines?",
    "Are mechanisms in place for faculty development?",
    "Are faculty motivated and satisfied to excel in profession?"
  ],
  standard6: [
    "Is enrollment process based on quantitative and qualitative criteria?",
    "Is enrollment process clearly documented and periodically evaluated?",
    "Is there a policy regarding program/credit transfer?",
    "Is the process to register students and monitor progress documented?",
    "Is student registration/monitoring process periodically evaluated?",
    "Is process to recruit and retain faculty documented?",
    "Are faculty evaluation and promotion processes consistent with university mission?",
    "Are faculty recruitment/evaluation processes periodically evaluated?",
    "Do processes ensure teaching emphasizes active learning and CLO attainment?",
    "Is teaching and delivery process periodically evaluated?",
    "Is there a process to ensure graduates complete requirements based on standards and documented procedures?",
    "Is graduation-compliance process periodically evaluated?",
    "Is information related to learning opportunities useful and accessible for external audiences?",
    "Does institute maintain high ethical standards in interactions with stakeholders?"
  ],
  standard7: [
    "To what extent do you agree institution provides sufficient financial and administrative support for quality teaching/research staff?",
    "To what extent do you agree secretarial support, technical staff and office equipment are adequate?",
    "To what extent do you agree graduate students/research assistants are sufficient for teaching and research goals?",
    "To what extent do you agree library, laboratories and computing facilities are well-resourced and maintained?",
    "To what extent do you agree institution has adequate infrastructure (LMS, internet, digital tools) for modern learning?",
    "To what extent do you agree classrooms, faculty offices and library provide conducive academic environment?"
  ]
};

module.exports = { STANDARD_WEIGHTS, STANDARD_QUESTIONS };
