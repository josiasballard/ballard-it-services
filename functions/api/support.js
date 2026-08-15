export async function onRequestPost(context) {
    const { request, env } = context;

    const jsonResponse = (body, status = 200) => {
        return new Response(JSON.stringify(body), {
            status,
            headers: {
                "Content-Type": "application/json; charset=UTF-8",
                "Cache-Control": "no-store"
            }
        });
    };

    const clean = (value, maxLength = 1000) => {
        if (typeof value !== "string") {
            return "";
        }

        return value
            .trim()
            .replace(/\r\n/g, "\n")
            .slice(0, maxLength);
    };

    try {
        const contentType = request.headers.get("content-type") || "";

        let data;

        if (contentType.includes("application/json")) {
            data = await request.json();
        } else {
            const formData = await request.formData();
            data = Object.fromEntries(formData.entries());
        }

        const name = clean(data.name, 120);
        const business = clean(data.business, 160);
        const email = clean(data.email, 254);
        const phone = clean(data.phone, 60);
        const requestType = clean(
            data["request-type"] || data.requestType,
            100
        );
        const message = clean(data.message, 5000);

        /*
         * Honeypot field.
         * Real users should never fill this out.
         */
        const website = clean(data.website, 200);

        if (website) {
            return jsonResponse({
                success: true,
                message: "Support request received."
            });
        }

        if (!name || !email || !requestType || !message) {
            return jsonResponse(
                {
                    success: false,
                    message:
                        "Please complete your name, email, request type, and message."
                },
                400
            );
        }

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            return jsonResponse(
                {
                    success: false,
                    message: "Please enter a valid email address."
                },
                400
            );
        }

        const requestLabels = {
            "computer-support": "Computer / Windows Problem",
            "microsoft-365": "Microsoft 365 / Outlook",
            "user-account": "User Account / MFA / Access",
            "pc-setup": "PC Setup or Replacement",
            "onsite": "Onsite IT Support",
            "ongoing": "Ongoing IT Support",
            "project": "IT Project",
            "other": "Other"
        };

        const requestLabel =
            requestLabels[requestType] || requestType;

        const businessDisplay =
            business || "Not provided";

        const phoneDisplay =
            phone || "Not provided";

        const subjectBusiness =
            business || name;

        const subject =
            `New Support Request — ${requestLabel} — ${subjectBusiness}`;

        const textBody = `
NEW BALLARD IT SUPPORT REQUEST

Request Type:
${requestLabel}

CONTACT INFORMATION

Name:
${name}

Business:
${businessDisplay}

Email:
${email}

Phone:
${phoneDisplay}

REQUEST DETAILS

${message}

--------------------------------------------------
Submitted through:
https://ballardit.com/contact/

Reply directly to:
${email}
        `.trim();

        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="
    margin:0;
    padding:0;
    background:#f4f7f9;
    font-family:Arial,Helvetica,sans-serif;
    color:#27374D;
">

    <div style="
        max-width:680px;
        margin:0 auto;
        padding:32px 18px;
    ">

        <div style="
            background:#ffffff;
            border:1px solid #dde6ed;
            border-radius:16px;
            overflow:hidden;
        ">

            <div style="
                padding:28px 30px;
                background:#27374D;
                color:#ffffff;
            ">
                <div style="
                    margin-bottom:6px;
                    font-size:12px;
                    font-weight:700;
                    letter-spacing:2px;
                    color:#9DB2BF;
                ">
                    BALLARD IT SERVICES
                </div>

                <div style="
                    font-size:24px;
                    font-weight:700;
                ">
                    New Support Request
                </div>
            </div>

            <div style="padding:30px;">

                <div style="
                    margin-bottom:26px;
                    padding-bottom:24px;
                    border-bottom:1px solid #dde6ed;
                ">
                    <div style="
                        margin-bottom:6px;
                        font-size:11px;
                        font-weight:700;
                        letter-spacing:1.5px;
                        color:#71808d;
                    ">
                        REQUEST TYPE
                    </div>

                    <div style="
                        font-size:18px;
                        font-weight:700;
                    ">
                        ${escapeHtml(requestLabel)}
                    </div>
                </div>

                ${infoRow("Name", name)}
                ${infoRow("Business", businessDisplay)}
                ${infoRow("Email", email)}
                ${infoRow("Phone", phoneDisplay)}

                <div style="
                    margin-top:28px;
                    padding-top:24px;
                    border-top:1px solid #dde6ed;
                ">
                    <div style="
                        margin-bottom:10px;
                        font-size:11px;
                        font-weight:700;
                        letter-spacing:1.5px;
                        color:#71808d;
                    ">
                        REQUEST DETAILS
                    </div>

                    <div style="
                        white-space:pre-wrap;
                        font-size:15px;
                        line-height:1.7;
                        color:#44515d;
                    ">${escapeHtml(message)}</div>
                </div>

                <div style="
                    margin-top:30px;
                    padding:18px;
                    border-radius:10px;
                    background:#eef3f6;
                    font-size:13px;
                    line-height:1.6;
                    color:#52616f;
                ">
                    Submitted through ballardit.com/contact/<br>
                    Reply to: ${escapeHtml(email)}
                </div>

            </div>

        </div>

    </div>

</body>
</html>
        `.trim();

        /*
         * EMAIL is the Cloudflare send_email binding
         * we'll configure in the dashboard next.
         *
         * The destination is your already-verified
         * Proton inbox.
         */

        await env.EMAIL.send({
            to: "ballardit@proton.me",

            /*
             * This sender must belong to your Cloudflare
             * Email Service domain.
             *
             * We'll configure/confirm this address in the
             * next step.
             */
            from: {
                email: "support@ballardit.com",
                name: "Ballard IT Website"
            },

            subject,

            text: textBody,

            html: htmlBody,

            replyTo: {
                email,
                name
            }
        });

        return jsonResponse({
            success: true,
            message:
                "Support request sent successfully."
        });

    } catch (error) {
        console.error("Support request error:", error);

        return jsonResponse(
            {
                success: false,
                message:
                    "Something went wrong while sending your request. Please call or email Ballard IT directly."
            },
            500
        );
    }
}


export async function onRequest(context) {
    if (context.request.method !== "POST") {
        return new Response(
            JSON.stringify({
                success: false,
                message: "Method not allowed."
            }),
            {
                status: 405,
                headers: {
                    "Content-Type": "application/json; charset=UTF-8",
                    "Allow": "POST"
                }
            }
        );
    }

    return onRequestPost(context);
}


function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function infoRow(label, value) {
    return `
        <div style="
            display:block;
            margin-bottom:18px;
        ">
            <div style="
                margin-bottom:4px;
                font-size:11px;
                font-weight:700;
                letter-spacing:1.3px;
                color:#82909b;
                text-transform:uppercase;
            ">
                ${escapeHtml(label)}
            </div>

            <div style="
                font-size:15px;
                font-weight:600;
                color:#27374D;
            ">
                ${escapeHtml(value)}
            </div>
        </div>
    `;
}