import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const adminApp: App =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
          privateKey:  "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDeYQGGx7EV1DEQ\ncL/uQL2EN9wvD0/YbxfwE/TNftwEd6bNwfsmiHEyTrKOLVac3tnp2Qm3cdo3Keg5\n8diWgHAt8tQle3/6jQP+kDuwhaKQkrnafz5wCJmK4VnyfFsydm82wYH85yBKYyyy\ndCZ3p03LzQp5IgOfKO485Afyp3HIfrPwXbe1hsntfu5o3akairNfFF3WDyZ2w6CD\nfwbSG208MAIR7llmwE1LbXRfrmNiSfKaAlYJXZLDibow5jmC1hAm4qDeVjILx4vD\n0hN8kJdtoyqU8LL2pYl9QDWJD3t8cXGxf4cUZD3da1+pmJLa5/UgSIExeX85eJMB\nBcSe8yBTAgMBAAECggEAUaBZ5xc1sUWKHPbF/LZW2kmG0N9V96QPrVgl66g9Koag\n+7XQcnxy0HyCnh2WRU6nvmakYmmwJ7+CNoLHdbb/dl5D8N48Q8OvS6m1vz3ORjMV\ndVZvnMALXCcL1S5Aa219tSOiiyprd+KfbYGk/Ra0P7KrvXr2yV1E1aT+JdvAsE7i\nSQIEMBTcJNI6m4StR82L9u236KtbXeycee6/B6pQTLLghqNkPdf+/uv6Pc1549KR\njpvAs+YlXB5zK0GMyb+6Q9tMkRB6duFUG/pM+KeRRluWzegVySv4WEL89j8Idshe\nXbbJ4WhIxKaT1HamQCJsnLRTtw7ZuIYJPsbaprs6wQKBgQD+T687Q9HZrqb0zG4N\nX43Qcf93OXw7EBkuY/ZSlhRymPqp3OFkx0kKQFMGMMnHmSJtH66tsUl6ipPAOg8t\nq8trwxMBO0GtXrs5MWyevnR055vY3aACRgr6mYaKnbOCIMXTmxa/Gfy3vFX3kqGl\n86TuEdUSgxr3WxPhhGh8SdOSrQKBgQDf2wnHxBsj54NFqQskEYorf5Sdf4Ia5H6/\nA+qDeB44oEetlMkSk8HfnhllewGkinKjWPuM7zRusftY9NTq25c970md+Rj+K4SW\nBvZuJ+JO0M9qeW8hDeSGKSjiEtG6oxbq5kDbeM5tumsMBtkDpbNwofq092M0cYI3\nWjgKzkre/wKBgQDFFDOUFga2T2cLJrHSo05fTzjOyDnB+8PH86eccLn/5RW8NXRm\niRnNW/P7RCvbBo1rS7Yu3Mk4sdO2kEfa+Nt384Dy310SYettcyPeEXJmdmaMNZQe\nrvErK3bcTUIjggpM5k9GYXk7WjS022lyFdKmvCMHaZqoPmi1x8rBJuVTMQKBgQCt\n8RmMbElagM50FoJdqHNgkWX9a9LA6sPB0V0sgu2YupJ3wqDrGn0PMV4yiH4iSKID\nY2UzgbuQOCRCXxwC0laW/ZSKd8B/33jKyuY5eixTadWBupIrcQwdY2YtJMpq58cr\nB3dmElz0zmHXmoqOVvczkempLIGdgoXYVPYvD1UGKQKBgQCzYzNO5NcWSeli6LpH\nohO1C31jlPECAbprLtJqiAcIBCgiGFwUfSB/WQWTzNpKasaYQmfk12LsCgOMatw4\na/OCugPFCtyJNa1cQE8mVmAa4j/ykrNkMtj1cG60NoUnuvTp5lni0kTbFQucx/om\nk0t3VIWcO/jdb0kYMqV3pxWu+Q==\n-----END PRIVATE KEY-----\n"
        }),
      });

export const adminDb = getFirestore(adminApp);