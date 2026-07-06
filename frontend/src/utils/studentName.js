export function getStudentName(studentId) {
  return localStorage.getItem(`studentName_${studentId}`) || studentId;
}