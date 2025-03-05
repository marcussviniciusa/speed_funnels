const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

// Configuração do transporte de email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Compilar templates de email usando Handlebars
const compileTemplate = (templateName, data) => {
  const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
  const templateSource = fs.readFileSync(templatePath, 'utf8');
  const template = handlebars.compile(templateSource);
  return template(data);
};

// Enviar email de relatório
exports.sendReportEmail = async ({ to, subject, reportName, companyName, reportDate, reportLink }) => {
  try {
    const html = compileTemplate('report-email', {
      reportName,
      companyName,
      reportDate,
      reportLink
    });
    
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Sistema de Relatórios'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw error;
  }
};

// Enviar notificação
exports.sendNotification = async ({ to, subject, message }) => {
  try {
    const html = compileTemplate('notification', {
      message
    });
    
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Sistema de Relatórios'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    throw error;
  }
}; 